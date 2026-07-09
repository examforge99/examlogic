 import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId, getToken } = await auth()
    console.log('AUTH userId:', userId)

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = await getToken({ template: 'supabase' })
    console.log('TOKEN length:', token?.length)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    )

    // Test 1: Simple query without join
    const { data: simpleData, error: simpleError } = await supabase
      .from('sessions')
      .select('id, mode, completed_at, overall_accuracy_percent')
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(4)

    console.log('SIMPLE error:', simpleError?.message ?? 'none')
    console.log('SIMPLE rows:', simpleData?.length ?? 0)

    // Test 2: Query with subjects join
    const { data: joinData, error: joinError } = await supabase
      .from('sessions')
      .select(`
        id,
        mode,
        overall_accuracy_percent,
        completed_at,
        subjects (
          name
        )
      `)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(4)

    console.log('JOIN error:', joinError?.message ?? 'none')
    console.log('JOIN rows:', joinData?.length ?? 0)
    console.log('JOIN first row:', JSON.stringify(joinData?.[0], null, 2))

    if (joinError) {
      return NextResponse.json({ error: joinError.message, details: joinError }, { status: 500 })
    }

    // Your original mapping
    const tests = (joinData ?? []).map((session) => {
      const subjectName = Array.isArray(session.subjects)
        ? session.subjects[0]?.name ?? null
        : (session.subjects as { name: string } | null)?.name ?? null

      return {
        id: session.id,
        title: formatTitle(session.mode, subjectName),
        date: formatDate(session.completed_at ?? ''),
        subjects: subjectName ?? 'Mixed',
        score: Math.round(session.overall_accuracy_percent ?? 0),
      }
    })

    return NextResponse.json({ tests })

  } catch (err) {
    console.error('FATAL ERROR:', err)
    return NextResponse.json({ error: String(err), stack: (err as Error).stack }, { status: 500 })
  }
}

function formatTitle(mode: string, subjectName: string | null): string {
  const subject = subjectName ?? 'Mixed'
  switch (mode) {
    case 'quick_fire':   return `Quick Fire — ${subject}`
    case 'campaign':     return `Campaign — ${subject}`
    case 'simulation':   return `JAMB Simulation`
    case 'sudden_death': return `Sudden Death — ${subject}`
    default:             return `Practice — ${subject}`
  }
}

function formatDate(timestamp: string): string {
  if (!timestamp) return '—'
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
        }
