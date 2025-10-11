"use client"

import { useBreakpoint } from "@/app/hooks/use-breakpoint"
import { useUser } from "@/lib/user-store/provider"
import { FeedbackForm } from "@/components/common/feedback-form"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer"
import { MessageAction } from "@/components/prompt-kit/message"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { useState } from "react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

// Fun feedback button texts
const feedbackTexts = [
  "Rate this",
  "Feedback",
  "How'd we do?",
  "Thoughts?",
  "Share feedback"
]

export function MessageFeedbackButton() {
  const { user } = useUser()
  const isMobile = useBreakpoint(768)
  const [isOpen, setIsOpen] = useState(false)
  
  // Randomly select feedback text
  const [feedbackText] = useState(() => 
    feedbackTexts[Math.floor(Math.random() * feedbackTexts.length)]
  )

  if (!isSupabaseEnabled) {
    return null
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const triggerButton = (
    <button
      className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex items-center justify-center rounded-full bg-transparent transition text-xs px-2 py-1"
      aria-label={feedbackText}
      type="button"
    >
      {feedbackText}
    </button>
  )

  if (isMobile) {
    return (
      <MessageAction tooltip="Share your feedback" side="bottom" delayDuration={0}>
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent className="bg-background border-border">
            <FeedbackForm authUserId={user?.id} onClose={handleClose} />
          </DrawerContent>
        </Drawer>
      </MessageAction>
    )
  }

  return (
    <MessageAction tooltip="Share your feedback" side="bottom" delayDuration={0}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="[&>button:last-child]:bg-background overflow-hidden p-0 shadow-xs sm:max-w-md [&>button:last-child]:top-3.5 [&>button:last-child]:right-3 [&>button:last-child]:rounded-full [&>button:last-child]:p-1">
          <VisuallyHidden>
            <DialogTitle>Feedback</DialogTitle>
          </VisuallyHidden>
          <FeedbackForm authUserId={user?.id} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </MessageAction>
  )
}