import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase
    .from('exam_sessions')
    .select(`
      id,
      mode,
      overall_accuracy_percent,
      completed_at,
      subjects ( name )
    `)
    .eq('user_id', userId)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })
    .limit(4)

  if (error) {
    console.error('[recent-tests]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const tests = (data ?? []).map((session) => {
  const raw = session.subjects
  const subjectName = Array.isArray(raw)
    ? (raw[0] as { name: string } | undefined)?.name ?? null
    : (raw as { name: string } | null)?.name ?? null

  return {
    id: session.id,
    title: formatTitle(session.mode, subjectName),
    date: formatDate(session.completed_at ?? ''),
    subjects: subjectName ?? 'Mixed',
    score: Math.round(session.overall_accuracy_percent ?? 0),
  }
})
  return NextResponse.json({ tests })
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
