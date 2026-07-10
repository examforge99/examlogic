import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const subjectColors: Record<string, string> = {
  Mathematics: '#3FB7FF',
  Physics: '#8B5CF6',
  Chemistry: '#25d6a2',
  Biology: '#EAB308',
  English: '#F97316',
  Literature: '#EC4899',
}

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
    .from('user_subject_stats')
    .select(`
      total_questions,
      subject_id,
      subjects ( name )
    `)
    .eq('user_id', userId)

  if (error) {
    console.error('[score-distribution]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const subjects = (data ?? []).map((row) => {
    const subjectName =
      (row.subjects as { name: string } | null)?.name ?? null

    return {
      name: subjectName ?? 'Unknown',
      count: row.total_questions,
      color: subjectColors[subjectName ?? ''] ?? '#A8B2C1',
    }
  })

  return NextResponse.json({ subjects })
}
