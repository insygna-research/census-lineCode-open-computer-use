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
import { UserPlus, Users, ArrowRight } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { DialogCollaborativeAuth } from "./dialog-collaborative-auth"

interface JoinRoomDialogProps {
  onRoomJoined?: () => void
  asSidebarButton?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function JoinRoomDialog({ onRoomJoined, asSidebarButton = false, open, onOpenChange }: JoinRoomDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen
  const [isCollaborativeAuthOpen, setIsCollaborativeAuthOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useUser()
  const { refresh } = useChats()
  const router = useRouter()
  const isLoggedIn = !!user

  const handleJoinRoom = async () => {
    if (!isLoggedIn) {
      setIsCollaborativeAuthOpen(true)
      return
    }

    if (!inviteCode.trim()) {
      toast({
        title: "Invite code is required",
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
          inviteCode: inviteCode.trim().toUpperCase(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to join room")
      }

      const { room } = await response.json()
      
      setIsOpen(false)
      setInviteCode("")
      
      // Refresh the chat list to show the new room
      await refresh()
      
      toast({
        title: "Joined project successfully!",
        status: "success",
      })

      // Navigate to the room
      router.push(`/c/${room.id}`)
      
      onRoomJoined?.()
    } catch (error) {
      console.error("Error joining room:", error)
      toast({
        title: error instanceof Error ? error.message : "Failed to join room",
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
          <UserPlus size={18} className="shrink-0" />
          <span className="truncate">Join Project</span>
        </button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
              >
                <Users className="h-6 w-6 text-primary" />
              </motion.div>
              <DialogTitle className="text-xl">Join Project</DialogTitle>
              <DialogDescription>
                Enter an invite code to join an existing project.
              </DialogDescription>
            </DialogHeader>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="invite-code" className="text-sm font-medium">
                  Invite Code
                </Label>
                <Input
                  id="invite-code"
                  placeholder="Enter invite code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  className="font-mono tracking-widest text-center text-lg h-12 border-border/50 focus:border-primary/50"
                />
              </div>
            </motion.div>

            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)} 
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleJoinRoom} 
                disabled={isLoading || !inviteCode.trim()}
                className={cn(
                  "flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                    </motion.div>
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
          onClick={() => !isLoggedIn ? setIsCollaborativeAuthOpen(true) : setIsOpen(true)}
        >
          <UserPlus size={16} className="mr-2" />
          Join Project
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
          >
            <Users className="h-6 w-6 text-primary" />
          </motion.div>
          <DialogTitle className="text-xl">Join Project</DialogTitle>
          <DialogDescription>
            Enter an invite code to join an existing project.
          </DialogDescription>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="invite-code" className="text-sm font-medium">
              Invite Code
            </Label>
            <Input
              id="invite-code"
              placeholder="Enter invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              disabled={isLoading}
              className="font-mono tracking-widest text-center text-lg h-12 border-border/50 focus:border-primary/50"
            />
          </div>
        </motion.div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleJoinRoom} 
            disabled={isLoading || !inviteCode.trim()}
            className={cn(
              "flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="mr-2"
                >
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" />
                </motion.div>
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

      <DialogCollaborativeAuth
        open={isCollaborativeAuthOpen}
        setOpen={setIsCollaborativeAuthOpen}
      />
    </Dialog>
  )
} 