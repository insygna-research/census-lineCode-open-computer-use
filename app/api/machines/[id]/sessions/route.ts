import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { transformSessionFromDB } from "@/lib/utils/db-transforms";
import type { StartSessionRequest } from "@/types/machines.types";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST /api/machines/[id]/sessions - Start a new session
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
    const body: StartSessionRequest = await request.json();

    // Validate machine ownership and status
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

    if (machine.status !== "running") {
      return NextResponse.json(
        { error: "Machine must be running to start a session" },
        { status: 400 }
      );
    }

    // Check for active sessions
    const { data: activeSessions } = await (supabase as any)
      .from("machine_sessions")
      .select("*")
      .eq("machine_id", machineId)
      .is("ended_at", null);

    if (activeSessions && activeSessions.length > 0) {
      return NextResponse.json(
        { error: "Machine already has an active session" },
        { status: 400 }
      );
    }

    // Check daily session limit
    const { data: todaySessions } = await (supabase as any)
      .from("machine_sessions")
      .select("id")
      .eq("user_id", userId)
      .gte("started_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const { data: limits } = await (supabase as any)
      .from("machine_limits")
      .select("max_sessions_per_day")
      .eq("user_id", userId)
      .single();

    if (
      todaySessions &&
      limits &&
      todaySessions.length >= limits.max_sessions_per_day
    ) {
      return NextResponse.json(
        { error: "Daily session limit reached" },
        { status: 403 }
      );
    }

    // Create session
    const sessionData = {
      machine_id: machineId,
      user_id: userId,
      session_type: body.sessionType,
      ai_model: body.aiModel,
      ai_objective: body.aiObjective,
      ai_completion_status: (body.sessionType as string) === "ai_controlled" ? "pending" as const : null,
    };

    const { data: session, error: sessionError } = await (supabase as any)
      .from("machine_sessions")
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error("Error creating session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Generate WebSocket token for secure connection
    const wsToken = await generateWebSocketToken(session!.id, userId);

    return NextResponse.json({
      session: transformSessionFromDB(session),
      connectionDetails: {
        vncUrl: `wss://${request.headers.get("host")}/api/machines/${machineId}/vnc`,
        agentUrl: `wss://${request.headers.get("host")}/api/machines/${machineId}/agent`,
        wsToken,
        publicIp: machine.public_ip_address,
        vncPort: machine.vnc_port,
        websocketPort: machine.websocket_port,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/machines/[id]/sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/machines/[id]/sessions - Get machine sessions
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

    // Verify machine ownership
    const { data: machine } = await supabase
      .from("user_machines")
      .select("id")
      .eq("id", machineId)
      .eq("user_id", userId)
      .single();

    if (!machine) {
      return NextResponse.json(
        { error: "Machine not found" },
        { status: 404 }
      );
    }

    // Get sessions with action counts
    const { data: sessions, error: sessionsError } = await supabase
      .from("machine_sessions")
      .select(`
        *,
        action_count:machine_ai_actions(count)
      `)
      .eq("machine_id", machineId)
      .order("started_at", { ascending: false });

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      sessions: (sessions || []).map(transformSessionFromDB).filter(Boolean) 
    });
  } catch (error) {
    console.error("Error in GET /api/machines/[id]/sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to generate WebSocket token
async function generateWebSocketToken(sessionId: string, userId: string): Promise<string> {
  // In production, use a proper JWT library
  const token = Buffer.from(
    JSON.stringify({
      sessionId,
      userId,
      exp: Date.now() + 3600000, // 1 hour expiry
    })
  ).toString("base64");
  
  return token;
}