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

  console.log('DEBUG', {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20),
    keyDefined: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    keyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 15),
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
    return NextResponse.json({ error: 'ANALYTICS_ACCURACY_FETCH_FAILED' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
