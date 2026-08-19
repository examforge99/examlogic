import { NextResponse } from 'next/server'
import {
  supabaseAdmin,
  getAuthenticatedUserId,
  sinceDate,
  logError,
} from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId, error } = await getAuthenticatedUserId()
  if (error) return error

  const { data, error: dbError } = await supabaseAdmin
    .from('user_daily_analytics')
    .select('date, total_questions, study_time_mins')
    .eq('user_id', userId)
    .gte('date', sinceDate(120))
    .order('date', { ascending: true })

  if (dbError) {
    logError('ANALYTICS_HEATMAP_FETCH_FAILED', {
      userId,
      supabaseCode: dbError.code,
      supabaseMessage: dbError.message,
      hint: dbError.hint ?? null,
      route: '/api/analytics/heatmap',
    })
    return NextResponse.json({
      error: 'ANALYTICS_HEATMAP_FETCH_FAILED',
      message: 'We could not load your consistency data. Please try again.',
    }, { status: 500 })
  }

  return NextResponse.json({ data })
}
