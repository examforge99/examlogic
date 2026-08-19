import { NextResponse } from 'next/server'
import { supabaseAdmin, getAuthenticatedUserId, sinceDate } from '@/lib/analytics/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId, error } = await getAuthenticatedUserId()
  if (error) return error

  const [difficultyResult, userResult] = await Promise.all([
    supabaseAdmin
      .from('user_daily_difficulty_analytics')
      .select('date, difficulty_level, total_questions, correct_answers, accuracy')
      .eq('user_id', userId)
      .gte('date', sinceDate(90))
      .order('date', { ascending: true }),

    supabaseAdmin
      .from('users')
      .select('total_points, current_difficulty_band')
      .eq('id', userId)
      .single(),
  ])

  if (difficultyResult.error) {
    console.error('[analytics/difficulty] difficulty', difficultyResult.error)
    return NextResponse.json({ error: 'Failed to fetch difficulty data' }, { status: 500 })
  }

  if (userResult.error) {
    console.error('[analytics/difficulty] user', userResult.error)
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }

  return NextResponse.json({
    data: difficultyResult.data,
    user: {
      totalPoints: userResult.data.total_points,
      currentDifficultyBand: userResult.data.current_difficulty_band,
    },
  })
}
