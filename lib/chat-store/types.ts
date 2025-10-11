import type { Tables } from "@/app/types/database.types"

export type Chat = Tables<"chats"> & {
  last_message_preview?: string
}
export type Message = Tables<"messages">
export type Chats = Tables<"chats"> & {
  last_message_preview?: string
}

// Extended chat type with collaborative participants
export type CollaborativeChat = Chat & {
  chat_participants?: Array<{
    id: string
    user_id: string
    role: "owner" | "moderator" | "participant"
    joined_at: string
    last_active_at: string
    permissions: any
    users: {
      display_name: string | null
      profile_image: string | null
      email: string
    }
  }>
}
