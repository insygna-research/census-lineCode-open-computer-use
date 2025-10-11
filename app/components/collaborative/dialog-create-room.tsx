"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toast"
import { useUser } from "@/lib/user-store/provider"
import { useChats } from "@/lib/chat-store/chats/provider"
import { Plus, Users, ArrowRight, Sparkle } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { DialogCollaborativeAuth } from "./dialog-collaborative-auth"

interface CreateRoomDialogProps {
  onRoomCreated?: () => void
  asSidebarButton?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateRoomDialog({ onRoomCreated, asSidebarButton = false, open, onOpenChange }: CreateRoomDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen
  const [isCollaborativeAuthOpen, setIsCollaborativeAuthOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()
  const { refresh } = useChats()
  const router = useRouter()
  const isLoggedIn = !!user

  const handleCreateRoom = async () => {
    if (!isLoggedIn) {
      setIsCollaborativeAuthOpen(true)
      return
    }

    if (!title.trim()) {
      toast({
        title: "Room title is required",
        status: "error",
      })
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch("/api/collaborative-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          maxParticipants,
          roomSettings: {},
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create room")
      }

      const { room } = await response.json()
      
      setIsOpen(false)
      setTitle("")
      setMaxParticipants(10)
      
      // Refresh the chat list to show the new room
      await refresh()
      
      toast({
        title: "Project created successfully!",
        status: "success",
      })

      // Navigate to the new room
      router.push(`/c/${room.id}`)
      
      onRoomCreated?.()
    } catch (error) {
      console.error("Error creating room:", error)
      toast({
        title: error instanceof Error ? error.message : "Failed to create room",
        status: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleButtonClick = () => {
    if (!isLoggedIn) {
      setIsCollaborativeAuthOpen(true)
    } else {
      setIsOpen(true)
    }
  }

  if (asSidebarButton) {
    return (
      <>
        <button
          className="group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all bg-background border border-border hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          type="button"
          onClick={handleButtonClick}
        >
          <Plus size={18} className="shrink-0" />
          <span className="truncate">Create New Project</span>
        </button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Start a new project to build your product with AI.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="room-title">Project Name</Label>
                <Input
                  id="room-title"
                  placeholder="Enter project name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-participants">Team Size</Label>
                <Input
                  id="max-participants"
                  type="number"
                  min="2"
                  max="50"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 10)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreateRoom} disabled={isLoading || !title.trim()}>
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogCollaborativeAuth
          open={isCollaborativeAuthOpen}
          setOpen={setIsCollaborativeAuthOpen}
        />
      </>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          size="sm"
          className="font-medium"
          onClick={() => !isLoggedIn ? setIsCollaborativeAuthOpen(true) : setIsOpen(true)}
        >
          <Plus size={16} className="mr-2" />
          Create Project
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Start a new project to build your product with AI.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-title">Project Name</Label>
            <Input
              id="room-title"
              placeholder="Enter project name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-participants">Team Size</Label>
            <Input
              id="max-participants"
              type="number"
              min="2"
              max="50"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 10)}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreateRoom} disabled={isLoading || !title.trim()}>
            {isLoading ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <DialogCollaborativeAuth
        open={isCollaborativeAuthOpen}
        setOpen={setIsCollaborativeAuthOpen}
      />
    </Dialog>
  )
} 