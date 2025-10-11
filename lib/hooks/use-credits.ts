"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/lib/user-store/provider"

interface Credits {
  balance: number
  total_purchased: number
  total_used: number
  last_purchase_at: string | null
  last_usage_at: string | null
  has_active_subscription?: boolean
  subscription_tier?: string | null
}

export function useCredits() {
  const { user } = useUser()
  const [credits, setCredits] = useState<Credits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCredits = async () => {
    if (!user) {
      setCredits(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/credits/balance")
      
      if (!response.ok) {
        throw new Error("Failed to fetch credits")
      }

      const data = await response.json()
      setCredits(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching credits:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch credits")
      setCredits(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredits()
  }, [user])

  return {
    credits,
    loading,
    error,
    refetch: fetchCredits,
  }
}