import { Chat } from "@/lib/chat-store/types"
import { UsersThree, Monitor } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { SidebarItem } from "./sidebar-item"
import { cn } from "@/lib/utils"

type SidebarListProps = {
  title: string
  items: Chat[]
  currentChatId: string
  isCollaborative?: boolean
}

export function SidebarList({ title, items, currentChatId, isCollaborative }: SidebarListProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Monitor size={14} />
          {title}
        </h3>
        <span className="text-xs text-muted-foreground/60">
          {items.length}
        </span>
      </div>
      <div className="space-y-1">
        {items.map((chat) => (
          <SidebarItem
            key={chat.id}
            chat={chat}
            currentChatId={currentChatId}
            isCollaborative={isCollaborative}
          />
        ))}
      </div>
    </div>
  )
}
