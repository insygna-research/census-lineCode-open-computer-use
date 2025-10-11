"use client"

import { useKeyShortcut } from "@/app/hooks/use-key-shortcut"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NotePencilIcon } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

export function ButtonNewChat() {
  const pathname = usePathname()
  const router = useRouter()

  useKeyShortcut(
    (e) => (e.key === "u" || e.key === "U") && e.metaKey && e.shiftKey,
    () => router.push("/")
  )

  if (pathname === "/") return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/"
          className="text-foreground hover:text-foreground hover:bg-muted/80 bg-background border border-border/50 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium inline-flex items-center px-2 py-1.5 h-8 sm:px-3 sm:py-2 sm:h-9 gap-1 sm:gap-2"
          prefetch
          aria-label="New Chat"
        >
          <NotePencilIcon size={16} />
          <span className="hidden sm:inline text-sm">New Chat</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>New Chat ⌘⇧U</TooltipContent>
    </Tooltip>
  )
}
