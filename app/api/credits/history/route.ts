import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
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

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const type = searchParams.get("type") // Optional filter by transaction type

    // Build query
    let query = (supabase as any)
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply type filter if provided
    if (type) {
      query = query.eq("type", type)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error("Error fetching transaction history:", transactionsError)
      return NextResponse.json(
        { error: "Failed to fetch transaction history" },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count } = await (supabase as any)
      .from("credit_transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    return NextResponse.json({
      transactions: transactions || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error in transaction history API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}