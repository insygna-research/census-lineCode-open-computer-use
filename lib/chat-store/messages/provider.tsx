"use client"

import { useChatSession } from "@/lib/chat-store/session/provider"
import { createClient } from "@/lib/supabase/client"
import type { Message as MessageAISDK } from "ai"
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react"
import { writeToIndexedDB } from "../persist"
import {
  cacheMessages,
  clearMessagesForChat,
  getCachedMessages,
  getMessagesFromDb,
  setMessages as saveMessages,
} from "./api"

interface MessagesContextType {
  messages: MessageAISDK[]
  isLoading: boolean
  setMessages: React.Dispatch<React.SetStateAction<MessageAISDK[]>>
  refresh: () => Promise<void>
  saveAllMessages: (messages: MessageAISDK[]) => Promise<void>
  cacheAndAddMessage: (message: MessageAISDK) => Promise<void>
  resetMessages: () => Promise<void>
  deleteMessages: () => Promise<void>
  // Removed collaborative features
  isCollaborativeRoom: boolean // Always false now
  lastSyncTime: Date | null
  syncStatus: 'idle' | 'syncing' | 'completed' | 'error'
  setStreamingStatus: (status: 'streaming' | 'ready' | 'submitted' | 'error' | null) => void
}

const MessagesContext = createContext<MessagesContextType | null>(null)

export function useMessages() {
  const context = useContext(MessagesContext)
  if (!context)
    throw new Error("useMessages must be used within MessagesProvider")
  return context
}

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<MessageAISDK[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle')
  const [streamingStatus, setStreamingStatus] = useState<'streaming' | 'ready' | 'submitted' | 'error' | null>(null)
  const { chatId } = useChatSession()

  const isRefreshingRef = useRef(false)
  const lastRefreshTimeRef = useRef<number>(0)
  const pendingRefreshRef = useRef<boolean>(false)

  // Simplified refresh function
  const refresh = useCallback(async (force = false) => {
    if (!chatId) return
    
    const now = Date.now()
    if (!force) {
      // If already refreshing or refreshed within last 300ms, skip
      if (isRefreshingRef.current || (now - lastRefreshTimeRef.current) < 300) {
        pendingRefreshRef.current = true
        return
      }
    }

    isRefreshingRef.current = true
    lastRefreshTimeRef.current = now
    pendingRefreshRef.current = false
    
    setSyncStatus('syncing')

    try {
      const fresh = await getMessagesFromDb(chatId)
      
      // Filter out any messages that contain only incomplete tool invocations
      const filteredFresh = fresh.map(msg => {
        if (msg.role === 'assistant' && msg.parts && Array.isArray(msg.parts)) {
          // Check if message has only incomplete tool invocations
          const nonToolParts = msg.parts.filter(part => part.type !== 'tool-invocation')
          const toolParts = msg.parts.filter(part => part.type === 'tool-invocation')
          
          if (nonToolParts.length === 0 && toolParts.length > 0) {
            // Check if all tool invocations are incomplete
            const allIncomplete = toolParts.every(part => 
              part.toolInvocation?.state === 'call' && 
              !('result' in (part.toolInvocation || {}))
            )
            
            if (allIncomplete) {
              // Return message with empty parts to prevent processing
              return { ...msg, parts: [], content: '' }
            }
          }
        }
        return msg
      })
      
      setMessages(filteredFresh)
      setLastSyncTime(new Date())
      setSyncStatus('completed')
    } catch (error) {
      console.error("Failed to refresh messages:", error)
      setSyncStatus('error')
    } finally {
      isRefreshingRef.current = false
      
      // Check if there was a pending refresh request
      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false
        setTimeout(() => refresh(false), 100)
      }
    }
  }, [chatId])

  // Load messages when chatId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!chatId) {
        setMessages([])
        return
      }

      setIsLoading(true)
      try {
        // Load cached messages first
        const cached = await getCachedMessages(chatId)
        if (cached.length > 0) {
          setMessages(cached)
        }
        
        // Fetch fresh messages
        await refresh(true)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [chatId, refresh])

  const saveAllMessages = useCallback(
    async (newMessages: MessageAISDK[]) => {
      if (!chatId) return
      
      try {
        await saveMessages(chatId, newMessages)
        await cacheMessages(chatId, newMessages)
        setMessages(newMessages)
      } catch (error) {
        console.error("Failed to save messages:", error)
      }
    },
    [chatId]
  )

  const cacheAndAddMessage = useCallback(async (message: MessageAISDK) => {
    if (!chatId) return
    
    setMessages(current => {
      // Check if message already exists
      const existingIndex = current.findIndex(m => m.id === message.id)
      
      if (existingIndex !== -1) {
        // Update existing message
        const updated = [...current]
        updated[existingIndex] = message
        return updated
      }
      
      // Check for duplicate content (within 1 second)
      const duplicateIndex = current.findIndex(m => 
        m.content === message.content && 
        m.role === message.role && 
        Math.abs(new Date(m.createdAt || 0).getTime() - new Date(message.createdAt || 0).getTime()) < 1000
      )
      
      if (duplicateIndex !== -1) {
        return current
      }
      
      // Add new message
      const newMessages = [...current, message]
      
      // Cache the updated messages
      cacheMessages(chatId, newMessages).catch(console.error)
      
      return newMessages
    })
  }, [chatId])

  const resetMessages = useCallback(async () => {
    setMessages([])
    if (chatId) {
      await clearMessagesForChat(chatId)
    }
  }, [chatId])

  const deleteMessages = useCallback(async () => {
    if (!chatId) return
    
    try {
      await clearMessagesForChat(chatId)
      setMessages([])
      await writeToIndexedDB("messages", [])
    } catch (error) {
      console.error("Failed to delete messages:", error)
    }
  }, [chatId])

  const value: MessagesContextType = {
    messages,
    isLoading,
    setMessages,
    refresh,
    saveAllMessages,
    cacheAndAddMessage,
    resetMessages,
    deleteMessages,
    isCollaborativeRoom: false, // Always false now
    lastSyncTime,
    syncStatus,
    setStreamingStatus,
  }

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  )
}