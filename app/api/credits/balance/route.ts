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

    // Use RPC function to get or create credits with proper permissions
    const { data: credits, error: creditsError } = await (supabase as any)
      .rpc('get_or_create_user_credits', { p_user_id: user.id })
      .single()

    if (creditsError) {
      console.error("Error fetching/creating credits:", creditsError)
      
      // Fallback: try direct select (in case user already has credits)
      const { data: existingCredits, error: selectError } = await (supabase as any)
        .from("user_credits")
        .select("balance, total_purchased, total_used, last_purchase_at, last_usage_at")
        .eq("user_id", user.id)
        .single()
      
      if (!selectError && existingCredits) {
        return NextResponse.json(existingCredits)
      }
      
      // If all fails, return default values
      return NextResponse.json({
        balance: 0,
        total_purchased: 0,
        total_used: 0,
        last_purchase_at: null,
        last_usage_at: null
      })
    }

    return NextResponse.json(credits)
  } catch (error) {
    console.error("Error in credits balance API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}