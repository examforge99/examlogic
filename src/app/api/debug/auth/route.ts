import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const logs: string[] = []

  try {
    // Step 1: Clerk auth
    const { userId, getToken } = await auth()
    logs.push(`1. Clerk userId: ${userId ?? 'NULL'}`)

    if (!userId) {
      return NextResponse.json({ logs, error: 'Not authenticated with Clerk' }, { status: 401 })
    }

    // Step 2: Get Supabase JWT
    const token = await getToken({ template: 'supabase' })
    logs.push(`2. Supabase token: ${token ? `present (${token.length} chars)` : 'NULL'}`)

    if (!token) {
      return NextResponse.json(
        { logs, error: 'getToken("supabase") returned null. Check Clerk JWT template.' },
        { status: 500 }
      )
    }

    // Step 3: Decode token to check claims
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    logs.push(`3. Token sub: ${payload.sub}`)
    logs.push(`4. Token aud: ${payload.aud}`)

    // Step 4: Connect to Supabase with Clerk JWT
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    // Step 5: Test sessions table
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })

    logs.push(`5. Sessions query error: ${sessionError?.message ?? 'none'}`)
    logs.push(`6. Sessions count: ${sessionData ?? 'no data'}`)

    // Step 6: Test user_subject_stats table
    const { data: statsData, error: statsError } = await supabase
      .from('user_subject_stats')
      .select('subject_id', { count: 'exact', head: true })

    logs.push(`7. Stats query error: ${statsError?.message ?? 'none'}`)
    logs.push(`8. Stats count: ${statsData ?? 'no data'}`)

    return NextResponse.json({ logs, ok: true })

  } catch (err) {
    logs.push(`FATAL: ${String(err)}`)
    return NextResponse.json({ logs, error: String(err) }, { status: 500 })
  }
        }

