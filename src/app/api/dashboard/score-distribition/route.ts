// app/api/dashboard/score-distribution/route.ts

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
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
    .from('user_subject_stats')
    .select(`
      total_questions,
      subject_id,
      subjects (
        name
      )
    `)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const subjectColors: Record<string, string> = {
    Mathematics: '#3FB7FF',
    Physics: '#8B5CF6',
    Chemistry: '#25d6a2',
    Biology: '#EAB308',
    English: '#F97316',
    Literature: '#EC4899',
  }

  const subjects = data.map((row) => ({
    name: row.subjects?.name ?? 'Unknown',
    count: row.total_questions,
    color: subjectColors[row.subjects?.name ?? ''] ?? '#A8B2C1',
  }))

  return NextResponse.json({ subjects })
                            }
