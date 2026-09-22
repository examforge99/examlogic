// lib/supabase/server.ts

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY

  if (!url || !key) throw new Error("Missing Supabase secret key configuration")

  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Alias used by engine files
export const createClient = getServiceRoleClient
