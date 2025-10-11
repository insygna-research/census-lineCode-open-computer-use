import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// POST: Update user activity in a room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    const { data: authData } = await supabase.auth.getUser()
    
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { activityType, metadata = {} } = body

    if (!activityType) {
      return NextResponse.json(
        { error: "Activity type is required" },
        { status: 400 }
      )
    }

    // Validate activity type
    const validActivityTypes = ["typing", "viewing", "joined", "left"]
    if (!validActivityTypes.includes(activityType)) {
      return NextResponse.json(
        { error: "Invalid activity type" },
        { status: 400 }
      )
    }

    // Check if user is a participant in this room
    const { data: userParticipant } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("chat_id", roomId)
      .eq("user_id", authData.user.id)
      .single()

    if (!userParticipant) {
      return NextResponse.json(
        { error: "Not a participant in this room" },
        { status: 403 }
      )
    }

    // Update or insert activity
    const { error } = await supabase
      .from("chat_activity")
      .upsert({
        chat_id: roomId,
        user_id: authData.user.id,
        activity_type: activityType,
        metadata,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
      }, {
        onConflict: "chat_id,user_id,activity_type"
      })

    if (error) {
      console.error("Error updating activity:", error)
      return NextResponse.json(
        { error: "Failed to update activity" },
        { status: 500 }
      )
    }

    // Update participant's last_active_at
    await supabase
      .from("chat_participants")
      .update({ last_active_at: new Date().toISOString() })
      .eq("chat_id", roomId)
      .eq("user_id", authData.user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error in activity POST:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET: Get current activity for a room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    const { data: authData } = await supabase.auth.getUser()
    
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a participant in this room
    const { data: userParticipant } = await supabase
      .from("chat_participants")
      .select("id")
      .eq("chat_id", roomId)
      .eq("user_id", authData.user.id)
      .single()

    if (!userParticipant) {
      return NextResponse.json(
        { error: "Not a participant in this room" },
        { status: 403 }
      )
    }

    // Get current activity (not expired)
    const { data: activities, error } = await supabase
      .from("chat_activity")
      .select(`
        *,
        users (
          display_name,
          profile_image
        )
      `)
      .eq("chat_id", roomId)
      .gt("expires_at", new Date().toISOString())

    if (error) {
      console.error("Error fetching activities:", error)
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: 500 }
      )
    }

    return NextResponse.json({ activities })
  } catch (err) {
    console.error("Error in activity GET:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE: Remove user's activity (e.g., stop typing)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    const { data: authData } = await supabase.auth.getUser()
    
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { activityType } = body

    if (!activityType) {
      return NextResponse.json(
        { error: "Activity type is required" },
        { status: 400 }
      )
    }

    // Delete the specific activity
    const { error } = await supabase
      .from("chat_activity")
      .delete()
      .eq("chat_id", roomId)
      .eq("user_id", authData.user.id)
      .eq("activity_type", activityType)

    if (error) {
      console.error("Error deleting activity:", error)
      return NextResponse.json(
        { error: "Failed to delete activity" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error in activity DELETE:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 