"use client"

import { Chat } from "./chat"

export function ChatContainer() {
  // Always use single chat with default model
  return (
    <div className="h-full overflow-hidden scrollbar-invisible scroll-container">
      <Chat />
    </div>
  )
}
