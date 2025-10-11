import { useCallback, useEffect, useState } from "react"

export function useChatDraft(chatId: string | null) {
  const storageKey = chatId ? `chat-draft-${chatId}` : "chat-draft-new"

  const [draftValue, setDraftValueState] = useState<string>("")
  const [hasMounted, setHasMounted] = useState(false)

  // Load from localStorage after component mounts to avoid hydration mismatch
  useEffect(() => {
    setHasMounted(true)
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey) || ""
      setDraftValueState(stored)
    }
  }, [storageKey])

  const setDraftValue = useCallback(
    (value: string) => {
      setDraftValueState(value)

      if (typeof window !== "undefined") {
        if (value) {
          localStorage.setItem(storageKey, value)
        } else {
          localStorage.removeItem(storageKey)
        }
      }
    },
    [storageKey]
  )

  const clearDraft = useCallback(() => {
    setDraftValueState("")
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey)
    }
  }, [storageKey])

  return {
    draftValue,
    setDraftValue,
    clearDraft,
  }
}
