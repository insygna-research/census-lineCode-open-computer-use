import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET: Get all collaborative rooms for a user
export async function GET(request: NextRequest) {
  try {
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

    // Get all collaborative rooms where user is a participant
    const { data: rooms, error } = await supabase
      .from("chats")
      .select(`
        *,
        chat_participants!inner (
          role,
          joined_at,
          last_active_at
        )
      `)
      .eq("collaborative", true)
      .eq("chat_participants.user_id", authData.user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching collaborative rooms:", error)
      return NextResponse.json(
        { error: "Failed to fetch rooms" },
        { status: 500 }
      )
    }

    return NextResponse.json({ rooms })
  } catch (err) {
    console.error("Error in collaborative rooms GET:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST: Create a new collaborative room
export async function POST(request: NextRequest) {
  try {
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
    const { title, maxParticipants = 10, roomSettings = {} } = body

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Room title is required" },
        { status: 400 }
      )
    }

    // Create the collaborative chat
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .insert({
        user_id: authData.user.id,
        title: title.trim(),
        collaborative: true,
        max_participants: maxParticipants,
        room_settings: roomSettings,
        public: false // Default to private rooms
      })
      .select("*")
      .single()

    if (chatError || !chat) {
      console.error("Error creating collaborative chat:", chatError)
      return NextResponse.json(
        { error: "Failed to create room" },
        { status: 500 }
      )
    }

    // The trigger should automatically add the owner as a participant
    // But let's verify and get the room with participant info
    const { data: roomWithParticipants, error: fetchError } = await supabase
      .from("chats")
      .select(`
        *,
        chat_participants (
          id,
          user_id,
          role,
          joined_at,
          last_active_at,
          permissions,
          users (
            display_name,
            profile_image,
            email
          )
        )
      `)
      .eq("id", chat.id)
      .single()

    if (fetchError) {
      console.error("Error fetching created room:", fetchError)
      return NextResponse.json(
        { error: "Room created but failed to fetch details" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      room: roomWithParticipants,
      inviteCode: chat.invite_code 
    })
  } catch (err) {
    console.error("Error in collaborative rooms POST:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 