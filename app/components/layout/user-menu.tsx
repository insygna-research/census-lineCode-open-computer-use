"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUser } from "@/lib/user-store/provider"
import { useRouter } from "next/navigation"

interface UserMenuProps {
  children?: React.ReactNode
  showTooltip?: boolean
}

export function UserMenu({ children, showTooltip = true }: UserMenuProps) {
  const { user } = useUser()
  const router = useRouter()

  const handleClick = () => {
    router.push("/account")
  }

  if (!user) return null

  const avatarButton = children || (
    <button
      onClick={handleClick}
      className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-transform hover:scale-105"
    >
      <Avatar className="bg-background hover:bg-muted cursor-pointer">
        <AvatarImage src={user?.profile_image ?? undefined} />
        <AvatarFallback>{user?.display_name?.charAt(0)}</AvatarFallback>
      </Avatar>
    </button>
  )

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {avatarButton}
        </TooltipTrigger>
        <TooltipContent>Account Settings</TooltipContent>
      </Tooltip>
    )
  }

  return avatarButton
}
