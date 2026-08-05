// lib/supabase.ts

import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ── Legacy client ──
// Existing routes use this — do not remove
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ── Browser client ──
// Use in client components
export function createBrowserSupabaseClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON)
}

// ── Server client ──
// Use in server components and new route handlers
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server component — cookies can't be set, safe to ignore
        }
      },
    },
  })
}

// ── Service role client ──
// Use in API routes that need to bypass RLS
// Never expose to client
export function createServiceSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  })
}
