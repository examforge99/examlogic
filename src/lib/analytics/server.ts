import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function getAuthenticatedUserId(): Promise<
  { userId: string; error: null } | { userId: null; error: NextResponse }
> {
  const { userId } = await auth()
  if (!userId) {
    return {
      userId: null,
      error: NextResponse.json({
        error: 'UNAUTHENTICATED',
        message: 'You must be signed in to access this resource.',
      }, { status: 401 }),
    }
  }
  return { userId, error: null }
}

export function sinceDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export function logError(
  code: string,
  context: Record<string, unknown>
) {
  console.error(JSON.stringify({
    code,
    ...context,
    timestamp: new Date().toISOString(),
  }))
}
