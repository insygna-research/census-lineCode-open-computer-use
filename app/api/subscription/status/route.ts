import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      )
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's active subscription
    const { data: subscription, error: subError } = await (supabase as any)
      .from("user_subscriptions")
      .select(`
        id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        canceled_at,
        subscription_plans (
          tier,
          name,
          monthly_credits,
          price
        )
      `)
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .single()

    if (subError || !subscription) {
      return NextResponse.json({ 
        subscription: null,
        hasSubscription: false 
      })
    }

    // Format the response
    const formattedSubscription = {
      id: subscription.id,
      status: subscription.status,
      tier: subscription.subscription_plans?.tier,
      name: subscription.subscription_plans?.name,
      monthlyCredits: subscription.subscription_plans?.monthly_credits,
      price: subscription.subscription_plans?.price,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
    }

    return NextResponse.json({ 
      subscription: formattedSubscription,
      hasSubscription: true 
    })
  } catch (error) {
    console.error("Error fetching subscription status:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    )
  }
}