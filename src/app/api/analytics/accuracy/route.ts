import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUserId, sinceDate } from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId, error } = await getAuthenticatedUserId()
  if (error) return error

  const { data, error: dbError } = await supabaseAdmin
    .from('user_daily_analytics')
    .select('date, accuracy, total_questions, correct_answers, study_time_mins')
    .eq('user_id', userId)
    .gte('date', sinceDate(90))
    .order('date', { ascending: true })

  if (dbError) {
    console.error('[analytics/accuracy]', dbError)
    return NextResponse.json({ error: 'Failed to fetch accuracy data' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
