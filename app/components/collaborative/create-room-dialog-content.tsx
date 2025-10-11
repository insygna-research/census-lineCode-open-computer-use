"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { useUser } from "@/lib/user-store/provider"
import { useChats } from "@/lib/chat-store/chats/provider"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface CreateRoomDialogContentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomCreated?: () => void
}

export function CreateRoomDialogContent({ open, onOpenChange, onRoomCreated }: CreateRoomDialogContentProps) {
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()
  const { refresh } = useChats()
  const router = useRouter()
  const isLoggedIn = !!user

  const handleCreateRoom = async () => {
    if (!isLoggedIn) return

    if (!title.trim()) {
      toast({
        title: "Room title is required",
        status: "error",
      })
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch("/api/create-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          title: title.trim(),
          model: "gpt-4o-mini", // Default model
          isAuthenticated: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create room")
      }

      const { chat } = await response.json()
      
      // Refresh the chats list to include the new room
      await refresh()
      
      // Reset form
      setTitle("")
      
      // Close dialog
      onOpenChange(false)
      
      // Navigate to the new chat
      router.push(`/c/${chat.id}`)
      
      // Call the callback if provided
      if (onRoomCreated) {
        onRoomCreated()
      }
      
      toast({
        title: "Task created successfully",
        status: "success",
      })
    } catch (error) {
      toast({
        title: "Failed to create task",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        status: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign New Task</DialogTitle>
          <DialogDescription>
            Start a new task with your AI assistant.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-title">Task Name</Label>
            <Input
              id="room-title"
              placeholder="Enter task name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleCreateRoom()
                }
              }}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateRoom} disabled={isLoading || !title.trim()}>
            {isLoading ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}