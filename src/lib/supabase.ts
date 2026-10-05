import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase public environment variables are not configured.')
  return { url, key }
}

export function createLegacySupabaseClient() {
  const { url, key } = publicConfig()
  return createClient(url, key)
}

export function createBrowserSupabaseClient() {
  const { url, key } = publicConfig()
  return createBrowserClient(url, key)
}

export async function createServerSupabaseClient() {
  const { url, key } = publicConfig()
  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {}
      },
    },
  })
}

export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase server environment variables are not configured.')

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
