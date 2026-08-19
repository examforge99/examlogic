import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUserId, sinceDate } from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId, error } = await getAuthenticatedUserId()
  if (error) return error

  // fetch 4 months back — enough for the month switcher
  const { data, error: dbError } = await supabaseAdmin
    .from('user_daily_analytics')
    .select('date, total_questions, study_time_mins')
    .eq('user_id', userId)
    .gte('date', sinceDate(120))
    .order('date', { ascending: true })

  if (dbError) {
    console.error('[analytics/heatmap]', dbError)
    return NextResponse.json({ error: 'Failed to fetch heatmap data' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
