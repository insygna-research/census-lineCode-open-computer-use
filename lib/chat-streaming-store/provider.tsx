"use client"

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import type { Message } from '@ai-sdk/react'

interface ChatStreamingContextType {
  streamingMessages: Message[]
  setStreamingMessages: (messages: Message[]) => void
  lastUpdate: number
}

const ChatStreamingContext = createContext<ChatStreamingContextType | undefined>(undefined)

export function ChatStreamingProvider({ children }: { children: ReactNode }) {
  const [streamingMessages, setStreamingMessagesState] = useState<Message[]>([])
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  
  const setStreamingMessages = useCallback((messages: Message[]) => {
    setStreamingMessagesState(messages)
    setLastUpdate(Date.now())
  }, [])
  
  return (
    <ChatStreamingContext.Provider value={{ streamingMessages, setStreamingMessages, lastUpdate }}>
      {children}
    </ChatStreamingContext.Provider>
  )
}

export function useChatStreaming() {
  const context = useContext(ChatStreamingContext)
  if (!context) {
    throw new Error('useChatStreaming must be used within a ChatStreamingProvider')
  }
  return context
}