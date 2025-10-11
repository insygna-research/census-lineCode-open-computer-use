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
import { motion } from "framer-motion"
import { Users, UserPlus, ArrowRight, Loader2 } from "lucide-react"

interface JoinRoomDialogContentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomJoined?: () => void
}

export function JoinRoomDialogContent({ open, onOpenChange, onRoomJoined }: JoinRoomDialogContentProps) {
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()
  const { refresh } = useChats()
  const router = useRouter()
  const isLoggedIn = !!user

  const handleJoinRoom = async () => {
    if (!isLoggedIn) return

    if (!inviteCode.trim()) {
      toast({
        title: "Please enter an invite code",
        status: "error",
      })
      return
    }

    try {
      setIsLoading(true)
      
      const response = await fetch("/api/collaborative-rooms/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to join room")
      }

      const { chatId } = await response.json()
      
      // Refresh the chats list to include the joined room
      await refresh()
      
      // Reset form
      setInviteCode("")
      
      // Close dialog
      onOpenChange(false)
      
      // Navigate to the room
      router.push(`/c/${chatId}`)
      
      // Call the callback if provided
      if (onRoomJoined) {
        onRoomJoined()
      }
      
      toast({
        title: "Successfully joined the project!",
        status: "success",
      })
    } catch (error) {
      toast({
        title: "Failed to join project",
        description: error instanceof Error ? error.message : "Invalid invite code or project not found",
        status: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center"
          >
            <Users className="h-6 w-6 text-primary" />
          </motion.div>
          <DialogTitle className="text-xl">Join Project</DialogTitle>
          <DialogDescription>
            Enter an invite code to join an existing project.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code" className="text-sm font-medium">
              Invite Code
            </Label>
            <Input
              id="invite-code"
              placeholder="e.g. ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isLoading) {
                  handleJoinRoom()
                }
              }}
              className="uppercase text-center text-lg font-mono"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground text-center">
              Ask your team leader for the project invite code
            </p>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleJoinRoom} 
            disabled={isLoading || !inviteCode.trim()}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Join Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}