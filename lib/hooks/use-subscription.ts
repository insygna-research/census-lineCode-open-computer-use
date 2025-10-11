import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-store/provider"

interface UserSubscription {
  id: string
  status: string
  tier?: string
  current_period_end?: string
  cancel_at_period_end: boolean
  created_at?: string
}

export function useSubscription() {
  const { user } = useUser()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/subscription/status")
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      } else {
        setError("Failed to fetch subscription")
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
      setError("Error fetching subscription")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [user])

  // Helper functions
  const isActiveSubscriber = subscription?.status === "active"
  const isProfessionalTier = subscription?.tier === "professional"
  const isEnterpriseTier = subscription?.tier === "enterprise"
  const isUnlimitedTier = isProfessionalTier || isEnterpriseTier

  return {
    subscription,
    loading,
    error,
    isActiveSubscriber,
    isProfessionalTier,
    isEnterpriseTier,
    isUnlimitedTier,
    refetch: fetchSubscription
  }
}