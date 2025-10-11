import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Dynamic project route - COMMENTED OUT to disable project feature
/*
// Original content would be here
*/

// Return 404 for all dynamic project routes since feature is disabled
export async function GET() {
  return new Response("Project feature is disabled", { status: 404 })
}

export async function PUT() {
  return new Response("Project feature is disabled", { status: 404 })
}

export async function DELETE() {
  return new Response("Project feature is disabled", { status: 404 })
}
