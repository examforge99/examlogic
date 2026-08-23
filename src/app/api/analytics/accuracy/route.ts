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

  // TEMP DEBUG — remove after confirming fix
  console.log('KEY_DEBUG', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30),
    secretKeyDefined: !!process.env.SUPABASE_SECRET_KEY,
    secretKeyPrefix: process.env.SUPABASE_SECRET_KEY?.slice(0, 15),
    userId,
  })

  const { data, error: dbError } = await supabaseAdmin
    .from('user_daily_analytics')
    .select('date, accuracy, total_questions, correct_answers, study_time_mins')
    .eq('user_id', userId)
    .gte('date', sinceDate(90))
    .order('date', { ascending: true })

  if (dbError) {
    logError('ANALYTICS_ACCURACY_FETCH_FAILED', {
      userId,
      supabaseCode: dbError.code,
      supabaseMessage: dbError.message,
      hint: dbError.hint ?? null,
      route: '/api/analytics/accuracy',
    })
    return NextResponse.json({
      error: 'ANALYTICS_ACCURACY_FETCH_FAILED',
      message: 'We could not load your accuracy trend data. Please try again.',
    }, { status: 500 })
  }

  console.log('QUERY_SUCCESS', { rowCount: data?.length ?? 0 })

  return NextResponse.json({ data })
}
