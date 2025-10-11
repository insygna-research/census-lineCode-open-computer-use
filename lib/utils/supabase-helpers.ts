import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function getSupabaseClient() {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Database connection failed");
  }
  return supabase;
}

export async function withSupabaseClient<T>(
  handler: (supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }
    return await handler(supabase);
  } catch (error) {
    console.error("Supabase client error:", error);
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
  }
}