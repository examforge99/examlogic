import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUserId } from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

const MODES = ['quick_fire', 'campaign', 'simulation', 'sudden_death'] as const

export async function GET() {
  const { userId, error } = await getAuthenticatedUserId()
  if (error) return error

  // fetch last 100 rows per mode in parallel
  const results = await Promise.all(
    MODES.map((mode) =>
      supabaseAdmin
        .from('user_daily_mode_analytics')
        .select('date, mode, sessions_count, total_questions, correct_answers, accuracy, best_score, study_time_mins')
        .eq('user_id', userId)
        .eq('mode', mode)
        .order('date', { ascending: false })
        .limit(100)
    )
  )

  const errors = results.filter((r) => r.error)
  if (errors.length > 0) {
    console.error('[analytics/mode]', errors)
    return NextResponse.json({ error: 'Failed to fetch mode data' }, { status: 500 })
  }

  // key by mode for easy client access
  const data = Object.fromEntries(
    MODES.map((mode, i) => [mode, results[i].data])
  )

  return NextResponse.json({ data })
}
