import { Database } from "@/app/types/database.types";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseEnabled } from "./config";

/**
 * Creates a Supabase client for server-side services that don't have request context
 * This client uses the service role key and bypasses RLS for administrative tasks
 */
export const createServiceClient = () => {
  if (!isSupabaseEnabled) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing Supabase environment variables for service client");
    return null;
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

/**
 * Creates a Supabase client for user-scoped operations in services
 * This client respects RLS and is used for operations that should be user-scoped
 */
export const createUserScopedServiceClient = () => {
  if (!isSupabaseEnabled) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables for user-scoped service client");
    return null;
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};