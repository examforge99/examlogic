// app/api/dashboard/recent-tests/route.ts

import { createClient } from '@supabase/supabase-js'
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId, getToken } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = await getToken({ template: 'supabase' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )

  const { data, error } = await supabase
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const tests = data.map((session) => ({
    id: session.id,
    title: formatTitle(session.mode, session.subjects?.name),
    date: formatDate(session.completed_at),
    subjects: session.subjects?.name ?? 'Mixed',
    score: Math.round(session.overall_accuracy_percent ?? 0),
  }))

  return NextResponse.json({ tests })
}

function formatTitle(mode: string, subjectName?: string): string {
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
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
