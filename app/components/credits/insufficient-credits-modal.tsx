"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles, Zap, Rocket, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCredits } from "@/lib/hooks/use-credits"

interface InsufficientCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  currentBalance?: number
  requiredCredits?: number
  estimatedRuntime?: number
  errorMessage?: string
}

const creditPackages = [
  {
    id: "starter",
    name: "Quick Boost",
    credits: 500,
    price: 5,
    runtime: "50 min",
    icon: Zap,
  },
  {
    id: "basic",
    name: "Power Pack",
    credits: 2000,
    price: 15,
    runtime: "3+ hours",
    icon: Rocket,
    popular: true,
  },
  {
    id: "pro",
    name: "Pro Bundle",
    credits: 5000,
    price: 30,
    runtime: "8+ hours",
    icon: Sparkles,
  },
]

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  currentBalance = 0,
  requiredCredits = 10,
  estimatedRuntime = 0,
  errorMessage,
}: InsufficientCreditsModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const { credits } = useCredits()

  useEffect(() => {
    // Check if user has active subscription
    const checkSubscription = async () => {
      try {
        const response = await fetch("/api/subscription/status")
        if (response.ok) {
          const data = await response.json()
          setHasSubscription(data.hasSubscription)
        }
      } catch (error) {
        console.error("Error checking subscription:", error)
      }
    }
    
    if (isOpen) {
      checkSubscription()
    }
  }, [isOpen])

  const handlePurchase = async (packageId: string) => {
    setIsLoading(true)
    try {
      if (!hasSubscription) {
        // Redirect to billing section to subscribe first
        router.push(`/account?section=billing&subscribe=true`)
      } else {
        // Redirect to account page billing section with package pre-selected
        router.push(`/account?section=billing&package=${packageId}`)
      }
      onClose()
    } catch (error) {
      console.error("Error initiating purchase:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = () => {
    setIsLoading(true)
    router.push(`/account?section=billing&subscribe=true`)
    onClose()
  }

  const creditsNeeded = Math.max(0, requiredCredits - currentBalance)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-5 animate-in fade-in-0 zoom-in-95 duration-200">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg font-medium">
            {hasSubscription ? "Let's power up your AI assistant" : "Unlock AI Features"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {hasSubscription 
              ? `You're ${creditsNeeded} credits short. Top up to continue your session.`
              : "Subscribe to get started with AI features and monthly credits."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 mb-5 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">Your balance</span>
          <div className="text-right">
            <div className="text-lg font-semibold">{currentBalance} credits</div>
            {estimatedRuntime > 0 && (
              <div className="text-xs text-muted-foreground">~{estimatedRuntime} min remaining</div>
            )}
          </div>
        </div>

        {!hasSubscription ? (
          // Show subscription prompt
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1">Subscription Required</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Subscribe to unlock AI features and get monthly credits.
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>Starting at $19/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>2,000+ credits included monthly</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>Access to all AI models</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      <span>Purchase additional credits anytime</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full"
              size="default"
            >
              <Crown className="mr-2 h-4 w-4" />
              View Subscription Plans
            </Button>
          </div>
        ) : (
          // Show credit packages for subscribed users
          <div className="space-y-2">
            {creditPackages.map((pkg) => {
              const Icon = pkg.icon
              const isPopular = pkg.popular

              return (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isLoading}
                  className={cn(
                    "group relative flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all",
                    "hover:border-primary/50 hover:bg-accent/50",
                    isPopular && "border-primary/30 bg-primary/5",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-2 left-3 bg-background px-1">
                      <span className="text-[10px] font-medium text-primary">POPULAR</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      "bg-muted group-hover:bg-primary/10"
                    )}>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{pkg.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {pkg.credits.toLocaleString()} credits • {pkg.runtime}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">${pkg.price}</div>
                    <div className="text-xs text-muted-foreground">
                      ${(pkg.price / pkg.credits * 100).toFixed(1)}¢/min
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <button
            onClick={() => router.push("/account?section=billing")}
            className="hover:text-primary transition-colors"
          >
            View all options →
          </button>
          <button
            onClick={onClose}
            className="hover:text-primary transition-colors"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}