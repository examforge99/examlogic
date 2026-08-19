import { NextResponse } from 'next/server'
import {
  supabaseAdmin,
  getAuthenticatedUserId,
  logError,
} from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

const VALID_MODES = ['quick_fire', 'campaign', 'simulation', 'sudden_death'] as const
type Mode = typeof VALID_MODES[number]

export async function GET(req: Request) {
  const { userId, error } = await getAuthenticatedUserId()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const mode   = searchParams.get('mode') as Mode | null
  const cursor = searchParams.get('cursor')

  if (!mode || !VALID_MODES.includes(mode)) {
    return NextResponse.json({
      error: 'ANALYTICS_MODE_HISTORY_INVALID_MODE',
      message: `'${mode}' is not a valid practice mode. Expected one of: ${VALID_MODES.join(', ')}.`,
    }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('user_daily_mode_analytics')
    .select('date, sessions_count, total_questions, correct_answers, accuracy, best_score, study_time_mins')
    .eq('user_id', userId)
    .eq('mode', mode)
    .order('date', { ascending: false })
    .limit(100)

  if (cursor) {
    const parsedCursor = new Date(cursor)
    if (isNaN(parsedCursor.getTime())) {
      return NextResponse.json({
        error: 'ANALYTICS_MODE_HISTORY_INVALID_CURSOR',
        message: `'${cursor}' is not a valid date cursor. Expected format: YYYY-MM-DD.`,
      }, { status: 400 })
    }
    query = query.lt('date', cursor)
  }

  const { data, error: dbError } = await query

  if (dbError) {
    logError('ANALYTICS_MODE_HISTORY_FETCH_FAILED', {
      userId,
      mode,
      cursor: cursor ?? null,
      supabaseCode: dbError.code,
      supabaseMessage: dbError.message,
      hint: dbError.hint ?? null,
      route: '/api/analytics/mode/history',
    })
    return NextResponse.json({
      error: 'ANALYTICS_MODE_HISTORY_FETCH_FAILED',
      message: `We could not load your ${mode.replace('_', ' ')} session history. Please try again.`,
    }, { status: 500 })
  }

  return NextResponse.json({
    data,
    nextCursor: data && data.length === 100 ? data[data.length - 1].date : null,
  })
}
