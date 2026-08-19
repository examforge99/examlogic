import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUserId } from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

const VALID_MODES = ['quick_fire', 'campaign', 'simulation', 'sudden_death']

export async function GET(req: Request) {
  const { userId, error } = await getAuthenticatedUserId()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const mode   = searchParams.get('mode')
  const cursor = searchParams.get('cursor') // oldest date already loaded

  if (!mode || !VALID_MODES.includes(mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  let query = supabaseAdmin
    .from('user_daily_mode_analytics')
    .select('date, sessions_count, total_questions, correct_answers, accuracy, best_score, study_time_mins')
    .eq('user_id', userId)
    .eq('mode', mode)
    .order('date', { ascending: false })
    .limit(100)

  // if cursor provided, fetch rows older than the oldest already loaded
  if (cursor) {
    query = query.lt('date', cursor)
  }

  const { data, error: dbError } = await query

  if (dbError) {
    console.error('[analytics/mode/history]', dbError)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }

  return NextResponse.json({
    data,
    nextCursor: data && data.length === 100 ? data[data.length - 1].date : null,
  })
}
