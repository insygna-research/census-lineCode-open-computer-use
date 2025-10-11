import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getAzureContainerService } from "@/lib/azure/container-instances";
import { transformMachineFromDB, transformSessionFromDB } from "@/lib/utils/db-transforms";
import type { MachineActionRequest } from "@/types/machines.types";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/machines/[id] - Get machine details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    const { id: machineId } = await params;
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Get machine details
    const { data: dbMachine, error: machineError } = await supabase
      .from("user_machines")
      .select("*")
      .eq("id", machineId)
      .eq("user_id", userId)
      .single();

    if (machineError || !dbMachine) {
      return NextResponse.json(
        { error: "Machine not found" },
        { status: 404 }
      );
    }
    
    const machine = transformMachineFromDB(dbMachine);

    // Get recent sessions
    const { data: sessions } = await supabase
      .from("machine_sessions")
      .select("*")
      .eq("machine_id", machineId)
      .order("started_at", { ascending: false })
      .limit(10);

    // Get current usage
    const { data: usage } = await supabase
      .from("machine_usage")
      .select("*")
      .eq("machine_id", machineId)
      .gte("period_start", new Date(new Date().setDate(1)).toISOString())
      .order("period_start", { ascending: false });

    return NextResponse.json({
      machine,
      sessions: (sessions || []).map(transformSessionFromDB).filter(Boolean),
      usage: usage || [],
    });
  } catch (error) {
    console.error("Error in GET /api/machines/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/machines/[id] - Perform action on machine
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    const { id: machineId } = await params;
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;
    const body: MachineActionRequest = await request.json();

    // Get machine
    const { data: machine, error: machineError } = await supabase
      .from("user_machines")
      .select("*")
      .eq("id", machineId)
      .eq("user_id", userId)
      .single();

    if (machineError || !machine) {
      return NextResponse.json(
        { error: "Machine not found" },
        { status: 404 }
      );
    }

    const azureService = getAzureContainerService();

    switch (body.action) {
      case "start":
        if (machine.status === "running") {
          return NextResponse.json(
            { error: "Machine is already running" },
            { status: 400 }
          );
        }
        
        // Allow starting from error state as well
        if (!["stopped", "error"].includes(machine.status)) {
          return NextResponse.json(
            { error: `Cannot start machine in ${machine.status} state` },
            { status: 400 }
          );
        }

        try {
          // Update status to starting
          await supabase
            .from("user_machines")
            .update({ status: "starting", status_message: "Initializing container..." })
            .eq("id", machineId);

          // Start container (may recreate if deallocated)
          const startResult = await azureService.startContainer(
            machine.azure_container_group,
            machine.azure_resource_group,
            userId
          );

          // If container was recreated, update the VNC password in database
          if (startResult.recreated && startResult.vncPassword) {
            await supabase
              .from("user_machines")
              .update({ 
                vnc_password: startResult.vncPassword,
                status_message: "Container recreated with new password" 
              })
              .eq("id", machineId);
          }

          // Immediately check status after start
          await updateMachineStatus(machineId, machine.azure_container_group);

          // Schedule additional status check
          // Note: In production, consider using a queue or cron job instead
          setTimeout(async () => {
            await updateMachineStatus(machineId, machine.azure_container_group);
          }, 10000);

          return NextResponse.json({ 
            message: startResult.recreated 
              ? "Machine recreated with new password" 
              : "Machine starting",
            recreated: startResult.recreated,
            ...(startResult.recreated && startResult.vncPassword ? { 
              vncPassword: startResult.vncPassword 
            } : {})
          });
        } catch (error: any) {
          // Update status to error if start fails
          await supabase
            .from("user_machines")
            .update({ 
              status: "error", 
              status_message: error.message || "Failed to start machine"
            })
            .eq("id", machineId);
          
          throw error;
        }

      case "stop":
        if (machine.status === "stopped") {
          return NextResponse.json(
            { error: "Machine is already stopped" },
            { status: 400 }
          );
        }

        // End any active sessions
        await supabase
          .from("machine_sessions")
          .update({ ended_at: new Date().toISOString() })
          .eq("machine_id", machineId)
          .is("ended_at", null);

        // Update status to stopping
        await supabase
          .from("user_machines")
          .update({ status: "stopping" })
          .eq("id", machineId);

        // Stop container
        await azureService.stopContainer(machine.azure_container_group);

        // Update status
        await supabase
          .from("user_machines")
          .update({ status: "stopped" })
          .eq("id", machineId);

        // Record usage
        await recordMachineUsage(machine);

        return NextResponse.json({ message: "Machine stopped" });

      case "restart":
        // End any active sessions before restarting
        await supabase
          .from("machine_sessions")
          .update({ ended_at: new Date().toISOString() })
          .eq("machine_id", machineId)
          .is("ended_at", null);

        // Update status to stopping
        await supabase
          .from("user_machines")
          .update({ status: "stopping", status_message: "Restarting machine..." })
          .eq("id", machineId);

        // Stop and start
        await azureService.stopContainer(machine.azure_container_group);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update status to starting
        await supabase
          .from("user_machines")
          .update({ status: "starting", status_message: "Machine is starting up..." })
          .eq("id", machineId);

        const startResult = await azureService.startContainer(
          machine.azure_container_group,
          machine.azure_resource_group,
          userId
        );

        // If container was recreated, update the VNC password in database
        if (startResult.recreated && startResult.vncPassword) {
          await supabase
            .from("user_machines")
            .update({ 
              vnc_password: startResult.vncPassword,
              status_message: "Container recreated with new password" 
            })
            .eq("id", machineId);
        }

        // Immediately check status after restart
        await updateMachineStatus(machineId, machine.azure_container_group);

        setTimeout(async () => {
          await updateMachineStatus(machineId, machine.azure_container_group);
        }, 5000);

        // Record usage for the previous session
        await recordMachineUsage(machine);

        return NextResponse.json({ 
          message: startResult.recreated 
            ? "Machine restarted with new password" 
            : "Machine restarting",
          recreated: startResult.recreated,
          ...(startResult.recreated && startResult.vncPassword ? { 
            vncPassword: startResult.vncPassword 
          } : {})
        });

      case "delete":
        if (machine.status === "running") {
          return NextResponse.json(
            { error: "Cannot delete running machine. Please stop it first." },
            { status: 400 }
          );
        }

        // Update status to deleting
        await supabase
          .from("user_machines")
          .update({ status: "deleting" })
          .eq("id", machineId);

        // Delete container
        await azureService.deleteContainer(machine.azure_container_group);

        // Delete from database (cascades will handle related records)
        await supabase
          .from("user_machines")
          .delete()
          .eq("id", machineId);

        return NextResponse.json({ message: "Machine deleted" });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in POST /api/machines/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to update machine status
async function updateMachineStatus(machineId: string, containerGroupName: string) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      console.error("Database connection failed in updateMachineStatus");
      return;
    }
    const azureService = getAzureContainerService();
    
    // Get current machine data first
    const { data: currentMachine } = await supabase
      .from("user_machines")
      .select("started_at")
      .eq("id", machineId)
      .single();
    
    const status = await azureService.getContainerStatus(containerGroupName);
    
    const updateData: any = {
      status: status.state,
      status_message: status.message,
      last_active_at: new Date().toISOString(),
    };
    
    if (status.ipAddress) {
      updateData.public_ip_address = status.ipAddress;
    }
    
    // Only set started_at if it's not already set and machine is running
    if (status.state === "running" && !currentMachine?.started_at) {
      updateData.started_at = new Date().toISOString();
    }
    
    // Clear started_at if machine is stopped
    if (status.state === "stopped") {
      updateData.started_at = null;
    }
    
    await supabase
      .from("user_machines")
      .update(updateData)
      .eq("id", machineId);
      
  } catch (error) {
    console.error("Error updating machine status:", error);
  }
}

// Helper function to record machine usage
async function recordMachineUsage(machine: any) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      console.error("Database connection failed in recordMachineUsage");
      return;
    }
    const azureService = getAzureContainerService();
    
    const startTime = machine.started_at || machine.created_at;
    const endTime = new Date();
    const durationHours = (endTime.getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    
    const cpuSeconds = machine.cpu_cores * durationHours * 3600;
    const memoryGbSeconds = machine.memory_gb * durationHours * 3600;
    const estimatedCost = azureService.estimateCost(
      machine.cpu_cores,
      machine.memory_gb,
      durationHours
    );
    
    await supabase.from("machine_usage").insert({
      user_id: machine.user_id,
      machine_id: machine.id,
      period_start: startTime,
      period_end: endTime.toISOString(),
      cpu_seconds: cpuSeconds,
      memory_gb_seconds: memoryGbSeconds,
      storage_gb_hours: machine.storage_gb * durationHours,
      network_gb_transferred: 0, // TODO: Implement network tracking
      estimated_cost: estimatedCost,
    });
    
  } catch (error) {
    console.error("Error recording machine usage:", error);
  }
}