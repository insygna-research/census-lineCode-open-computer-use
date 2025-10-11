"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface Participant {
  id: string
  user_id: string
  role: "owner" | "moderator" | "participant"
  joined_at: string
  last_active_at: string
  users: {
    display_name: string | null
    profile_image: string | null
    email: string
  }
}

interface CollaborativeRoom {
  id: string
  title: string
  collaborative: boolean
  max_participants: number
  invite_code: string
  room_settings: any
  chat_participants: Array<{
    id: string
    user_id: string
    role: "owner" | "moderator" | "participant"
    joined_at: string
    last_active_at: string
    users: {
      display_name: string | null
      profile_image: string | null
      email: string
    }
  }>
}

interface RoomData {
  room: CollaborativeRoom | null
  participants: Participant[]
  lastMessageUpdate: Date | null
  isLoading?: boolean
}

interface CollaborativeRoomContextType {
  roomData: RoomData | null
  setRoomData: (data: RoomData | null) => void
  updateLastMessageUpdate: (date: Date) => void
}

const CollaborativeRoomContext = createContext<CollaborativeRoomContextType | null>(null)

export function useCollaborativeRoomData() {
  const context = useContext(CollaborativeRoomContext)
  if (!context) {
    throw new Error("useCollaborativeRoomData must be used within CollaborativeRoomProvider")
  }
  return context
}

export function CollaborativeRoomProvider({ children }: { children: ReactNode }) {
  const [roomData, setRoomData] = useState<RoomData | null>(null)

  const updateLastMessageUpdate = (date: Date) => {
    setRoomData(prev => prev ? { ...prev, lastMessageUpdate: date } : null)
  }

  return (
    <CollaborativeRoomContext.Provider 
      value={{ 
        roomData, 
        setRoomData, 
        updateLastMessageUpdate 
      }}
    >
      {children}
    </CollaborativeRoomContext.Provider>
  )
} 