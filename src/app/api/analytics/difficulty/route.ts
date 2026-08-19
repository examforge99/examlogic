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
    logError('ANALYTICS_DIFFICULTY_FETCH_FAILED', {
      userId,
      supabaseCode: difficultyResult.error.code,
      supabaseMessage: difficultyResult.error.message,
      hint: difficultyResult.error.hint ?? null,
      route: '/api/analytics/difficulty',
    })
    return NextResponse.json({
      error: 'ANALYTICS_DIFFICULTY_FETCH_FAILED',
      message: 'We could not load your difficulty performance data. Please try again.',
    }, { status: 500 })
  }

  if (userResult.error) {
    logError('ANALYTICS_DIFFICULTY_USER_FETCH_FAILED', {
      userId,
      supabaseCode: userResult.error.code,
      supabaseMessage: userResult.error.message,
      hint: userResult.error.hint ?? null,
      route: '/api/analytics/difficulty',
    })
    return NextResponse.json({
      error: 'ANALYTICS_DIFFICULTY_USER_FETCH_FAILED',
      message: 'We could not load your level progress data. Please try again.',
    }, { status: 500 })
  }

  return NextResponse.json({
    data: difficultyResult.data,
    user: {
      totalPoints: userResult.data.total_points,
      currentDifficultyBand: userResult.data.current_difficulty_band,
    },
  })
}
