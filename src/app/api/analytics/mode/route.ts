import { NextResponse } from 'next/server'
import {
  supabaseAdmin,
  getAuthenticatedUserId,
  logError,
} from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

const MODES = ['quick_fire', 'campaign', 'simulation', 'sudden_death'] as const

export async function GET() {
  const { userId, error } = await getAuthenticatedUserId()
  if (error) return error

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

  const failedIndex = results.findIndex((r) => r.error)
  if (failedIndex !== -1) {
    const failedMode = MODES[failedIndex]
    const dbError = results[failedIndex].error!
    logError('ANALYTICS_MODE_FETCH_FAILED', {
      userId,
      failedMode,
      supabaseCode: dbError.code,
      supabaseMessage: dbError.message,
      hint: dbError.hint ?? null,
      route: '/api/analytics/mode',
    })
    return NextResponse.json({
      error: 'ANALYTICS_MODE_FETCH_FAILED',
      message: `We could not load your ${failedMode.replace('_', ' ')} performance data. Please try again.`,
      failedMode,
    }, { status: 500 })
  }

  const data = Object.fromEntries(
    MODES.map((mode, i) => [mode, results[i].data])
  )

  return NextResponse.json({ data })
}
