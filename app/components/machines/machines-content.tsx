"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Monitor, Cpu, HardDrive, Clock, DollarSign, MonitorCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MachineCard } from "@/app/components/machines/machine-card";
import { CreateMachineDialog } from "@/app/components/machines/create-machine-dialog";
import { UsageStats } from "@/app/components/machines/usage-stats";
import type { UserMachine, MachineUsage } from "@/types/machines.types";

interface MachinesData {
  machines: UserMachine[];
  limits: {
    max_machines: number;
    max_cpu_cores: number;
    max_memory_gb: number;
    max_storage_gb: number;
  };
  usage: {
    machines_count: number;
    total_cpu_cores: number;
    total_memory_gb: number;
    total_storage_gb: number;
  };
}

export function MachinesContent() {
  const router = useRouter();
  // Remove unused store methods since we're fetching directly from database
  const [loading, setLoading] = useState(true);
  const [machines, setMachines] = useState<UserMachine[]>([]);
  const [limits, setLimits] = useState<MachinesData["limits"]>({
    max_machines: 3,
    max_cpu_cores: 4,
    max_memory_gb: 8,
    max_storage_gb: 50,
  });
  const [usage, setUsage] = useState<MachinesData["usage"]>({
    machines_count: 0,
    total_cpu_cores: 0,
    total_memory_gb: 0,
    total_storage_gb: 0,
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusPollingIntervals, setStatusPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fastPollingTimeout, setFastPollingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMachines();
  }, []);
  
  useEffect(() => {
    // Start polling for any machines that are in transitioning states
    const transitioningMachines = machines.filter(m => 
      ["creating", "starting", "stopping", "deleting"].includes(m.status)
    );
    
    transitioningMachines.forEach(machine => {
      // Only start polling if we're not already polling this machine
      if (!statusPollingIntervals.has(machine.id)) {
        pollMachineStatus(machine.id);
      }
    });
  }, [machines.length]); // Only re-run when number of machines changes
  
  useEffect(() => {
    // Cleanup intervals on unmount
    return () => {
      statusPollingIntervals.forEach(interval => clearInterval(interval));
      if (fastPollingTimeout) {
        clearTimeout(fastPollingTimeout);
      }
    };
  }, []);

  const fetchMachines = async () => {
    try {
      const response = await fetch("/api/machines");
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/auth");
          return;
        }
        throw new Error("Failed to fetch machines");
      }

      const data: MachinesData = await response.json();
      
      // Set machines directly from database
      setMachines(data.machines);
      setLimits(data.limits);
      
      // Calculate usage from database machines only
      const totalCpuCores = data.machines.reduce((sum, m) => sum + (m.cpuCores || 0), 0);
      const totalMemoryGb = data.machines.reduce((sum, m) => sum + (m.memoryGb || 0), 0);
      const totalStorageGb = data.machines.reduce((sum, m) => sum + (m.storageGb || 0), 0);
      
      setUsage({
        machines_count: data.machines.length,
        total_cpu_cores: totalCpuCores,
        total_memory_gb: totalMemoryGb,
        total_storage_gb: totalStorageGb,
      });
      
      // Start polling for machines that are in creating/starting state
      data.machines.forEach(machine => {
        if ((machine.status === "creating" || machine.status === "starting") && !statusPollingIntervals.has(machine.id)) {
          pollMachineStatus(machine.id);
        }
      });
    } catch (error) {
      console.error("Error fetching machines:", error);
      toast.error("Failed to load machines");
    } finally {
      setLoading(false);
    }
  };

  const pollMachineStatus = (machineId: string) => {
    // Poll every 5 seconds for creating/starting machines
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/machines");
        if (!response.ok) {
          console.error("Failed to poll machine status");
          return;
        }
        
        const data: MachinesData = await response.json();
        const machine = data.machines.find(m => m.id === machineId);
        
        if (!machine || (machine.status !== "creating" && machine.status !== "starting")) {
          // Machine is no longer in creating/starting state, stop polling
          clearInterval(interval);
          statusPollingIntervals.delete(machineId);
          
          // Update the machines list with latest data
          setMachines(data.machines);
          
          // If machine was in creating/starting state and is now running, show notification
          const machine = data.machines.find(m => m.id === machineId);
          if (machine?.status === "running") {
            clearInterval(interval);
            statusPollingIntervals.delete(machineId);
            toast.success(`${machine.displayName} is now running!`, {
              description: "You can now connect to your machine.",
              action: {
                label: "Open",
                onClick: () => window.location.href = `/machines/${machineId}`,
              },
            });
          } else if (machine?.status === "error") {
            clearInterval(interval);
            statusPollingIntervals.delete(machineId);
            toast.error(`${machine.displayName} encountered an error`, {
              description: "Please try creating the machine again.",
            });
          }
        }
      } catch (error) {
        console.error("Error polling machine status:", error);
      }
    }, 5000);
    
    // Track the interval so we can clean it up
    statusPollingIntervals.set(machineId, interval);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMachines();
    setRefreshing(false);
  };

  const handleMachineCreated = async () => {
    // Immediately refresh to show the creating machine
    await fetchMachines();
    
    // Set up fast polling for 30 seconds to catch the new machine quickly
    if (fastPollingTimeout) {
      clearTimeout(fastPollingTimeout);
    }
    
    let pollCount = 0;
    const fastPoll = async () => {
      pollCount++;
      await fetchMachines();
      
      // Continue fast polling for up to 30 seconds (15 polls at 2 second intervals)
      if (pollCount < 15) {
        const timeout = setTimeout(fastPoll, 2000);
        setFastPollingTimeout(timeout);
      } else {
        setFastPollingTimeout(null);
      }
    };
    
    // Start fast polling after 1 second
    const timeout = setTimeout(fastPoll, 1000);
    setFastPollingTimeout(timeout);
  };
  
  // Removed pollForPendingMachine - we now poll for all creating/starting machines
  // Removed startStatusPolling - now using simpler pollMachineStatus

  const handleMachineUpdated = (updatedMachine: UserMachine) => {
    setMachines(machines.map(m => 
      m.id === updatedMachine.id ? updatedMachine : m
    ));
  };

  const handleMachineDeleted = (machineId: string) => {
    setMachines(machines.filter(m => m.id !== machineId));
    toast.success("Machine deleted successfully");
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-invisible relative bg-transparent">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl space-y-6 relative z-10">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const runningMachines = machines.filter(m => m.status === "running").length;
  const creatingMachines = machines.filter(m => m.status === "creating").length;
  const stoppedMachines = machines.filter(m => m.status === "stopped").length;
  const totalMachines = machines.length;

  // Filter machines based on selected status
  const filteredMachines = statusFilter === "all" 
    ? machines 
    : machines.filter(m => m.status === statusFilter);

  const statusFilters = [
    { id: "all", label: "All", count: totalMachines },
    { id: "running", label: "Running", count: runningMachines },
    { id: "creating", label: "Creating", count: creatingMachines },
    { id: "stopped", label: "Stopped", count: stoppedMachines },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-invisible relative bg-transparent">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Virtual Machines</h1>
            <p className="text-muted-foreground mt-1">
              Manage your AI-controlled desktop environments
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            size="lg"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Machine
          </Button>
        </div>

        {/* Simple Banner */}
        <div className="rounded-lg bg-primary text-primary-foreground p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <MonitorCog className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold">AI-Optimized VMs, Zero Hassle</h3>
              <p className="text-xs opacity-90 mt-0.5">
                AI automatically selects ideal specs for your workflow
              </p>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Machines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{usage.machines_count}</span>
                <span className="text-sm text-muted-foreground">of {limits.max_machines}</span>
              </div>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-foreground/80 transition-all duration-500"
                  style={{ width: `${Math.min((usage.machines_count / limits.max_machines) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CPU Cores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{usage.total_cpu_cores}</span>
                <span className="text-sm text-muted-foreground">of {limits.max_cpu_cores}</span>
              </div>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-foreground/80 transition-all duration-500"
                  style={{ width: `${Math.min((usage.total_cpu_cores / limits.max_cpu_cores) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{usage.total_memory_gb}</span>
                <span className="text-sm text-muted-foreground">of {limits.max_memory_gb} GB</span>
              </div>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-foreground/80 transition-all duration-500"
                  style={{ width: `${Math.min((usage.total_memory_gb / limits.max_memory_gb) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{usage.total_storage_gb}</span>
                <span className="text-sm text-muted-foreground">of {limits.max_storage_gb} GB</span>
              </div>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-foreground/80 transition-all duration-500"
                  style={{ width: `${Math.min((usage.total_storage_gb / limits.max_storage_gb) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Filters */}
        {machines.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`
                  px-4 py-2 rounded-lg transition-all duration-300
                  ${statusFilter === filter.id 
                    ? 'bg-foreground text-background font-medium' 
                    : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {filter.label}
                  {filter.count > 0 && (
                    <span className={`
                      text-xs px-1.5 py-0.5 rounded-full
                      ${statusFilter === filter.id 
                        ? 'bg-background/20' 
                        : 'bg-foreground/10'
                      }
                    `}>
                      {filter.count}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Machines Grid */}
        {machines.length === 0 ? (
          <Card className="border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MonitorCog className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No machines yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first virtual machine to get started with AI-controlled desktops
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Machine
              </Button>
            </CardContent>
          </Card>
        ) : filteredMachines.length === 0 ? (
          <Card className="border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No {statusFilter !== 'all' ? statusFilter : ''} machines</h3>
              <p className="text-muted-foreground text-center">
                {statusFilter === 'all' 
                  ? 'No machines found.' 
                  : `No machines are currently ${statusFilter}.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMachines.map(machine => (
              <MachineCard
                key={machine.id}
                machine={machine}
                onUpdate={handleMachineUpdated}
                onDelete={handleMachineDeleted}
              />
            ))}
          </div>
        )}

        {/* Create Machine Dialog */}
        <CreateMachineDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            // If dialog is being closed (after creation), trigger fast polling
            if (!open && showCreateDialog) {
              handleMachineCreated();
            }
          }}
          onMachineCreated={handleMachineCreated}
        />
      </div>
    </div>
  );
}