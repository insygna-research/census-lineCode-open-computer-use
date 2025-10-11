import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    id: string;
    sessionId: string;
  }>;
}

// DELETE /api/machines/[id]/sessions/[sessionId] - End a session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    
    const { id: machineId, sessionId } = await params;
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Verify session ownership and machine relationship
    const { data: session, error: sessionError } = await supabase
      .from("machine_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("machine_id", machineId)
      .eq("user_id", userId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.ended_at) {
      return NextResponse.json(
        { error: "Session already ended" },
        { status: 400 }
      );
    }

    // End the session
    const { error: updateError } = await supabase
      .from("machine_sessions")
      .update({
        ended_at: new Date().toISOString(),
        ai_completion_status:
          session.session_type === "ai_controlled" ? "cancelled" : null,
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Error ending session:", updateError);
      return NextResponse.json(
        { error: "Failed to end session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Session ended successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/machines/[id]/sessions/[sessionId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}