import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { fetchCandidates } from '@/lib/engines/shared/candidate'
import { fetchServedQuestions } from '@/lib/engines/shared/questions'
import { recordCooldown } from '@/lib/engines/shared/cooldown'
import { hasActiveSession } from '@/lib/engines/shared/session-guard'
import { runQuickfireLottery } from '@/lib/engines/quickfire/lottery'
import { LotteryResult } from '@/lib/engines/shared/types'

const QUESTIONS_PER_SUBJECT = 5
const TOTAL_QUESTIONS = 20
const SESSION_TIME_SECONDS = 900 // 15 minutes
const HOURLY_SESSION_CAP = 5

export async function POST(req: NextRequest) {
  try {
    // Step 1 — auth
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Step 2 — active session check (single device / cross-device guard)
    const active = await hasActiveSession(userId)
    if (active) {
      return NextResponse.json(
        { error: 'You have an active session. Complete it before starting a new one' },
        { status: 409 }
      )
    }

    // Step 3 — parallel preflight: user profile + rate limit
    const oneHourAgo = new Date(
      Date.now() - 60 * 60 * 1000
    ).toISOString()

    const [userResult, rateLimitResult] = await Promise.all([
      supabase
        .from('users')
        .select('jamb_subjects')
        .eq('id', userId)
        .single(),

      supabase
        .from('exam_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('mode', 'quick_fire')
        .gte('started_at', oneHourAgo)
    ])

    // Validate user
    const { data: user, error: userError } = userResult
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.jamb_subjects || user.jamb_subjects.length === 0) {
      return NextResponse.json(
        { error: 'Please complete your subject selection first' },
        { status: 400 }
      )
    }

    // Validate rate limit
    const { count: recentCount } = rateLimitResult
    if ((recentCount ?? 0) >= HOURLY_SESSION_CAP) {
      return NextResponse.json(
        { error: 'You have reached the session limit. Try again in an hour' },
        { status: 429 }
      )
    }

    // Step 4 — resolve subject slugs to IDs
    const { data: subjects, error: subjectError } = await supabase
      .from('subjects')
      .select('id, slug, name')
      .in('slug', user.jamb_subjects)

    if (subjectError || !subjects || subjects.length === 0) {
      return NextResponse.json(
        { error: 'Could not resolve user subjects' },
        { status: 500 }
      )
    }

    // Step 5 — run lottery per subject
    const lotteryResults: LotteryResult[] = []

    for (const subject of subjects) {
      const candidates = await fetchCandidates(
        userId,
        subject.id
        // No topic_id — full subject pool for Quickfire
      )

      const result = runQuickfireLottery(
        candidates,
        subject.id,
        QUESTIONS_PER_SUBJECT
      )

      lotteryResults.push(result)
    }

    // Step 6 — collect winning IDs
    const allWinningIds = lotteryResults.flatMap(r => r.question_ids)

    if (allWinningIds.length < TOTAL_QUESTIONS) {
      return NextResponse.json(
        { error: 'Not enough questions available. Try again later' },
        { status: 503 }
      )
    }

    // Step 7 — fetch full question data for winners only
    // correct_option_id never included in response
    const questions = await fetchServedQuestions(lotteryResults)

    // Step 8 — create session
    const now = new Date()
    const expiresAt = new Date(
      now.getTime() + SESSION_TIME_SECONDS * 1000
    )

    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .insert({
        user_id: userId,
        mode: 'quick_fire',
        status: 'active',
        is_completed: false,
        total_questions: questions.length,
        correct_count: 0,
        total_time_seconds: SESSION_TIME_SECONDS,
        base_points: 0,
        bonus_points: 0,
        total_points: 0,
        gems_earned: 0,
        is_flagged: false,
        missed_heartbeats: 0,
        total_absence_events: 0,
        auto_submitted: false,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (sessionError || !session) {
      console.error('[quickfire/start] session insert failed:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Step 9 — insert exam_session_questions
    const questionRows = questions.map((q, index) => ({
      session_id: session.id,
      question_id: q.id,
      subject_id: q.subject_id,
      topic_id: q.topic_id,
      difficulty_level: q.setter_difficulty,
      position: index + 1,
      correct_option_id: null,
      selected_answer: null,
      is_correct: null,
      time_spent_seconds: 0,
      change_count: 0,
      answer_history: []
    }))

    const { error: sqError } = await supabase
      .from('exam_session_questions')
      .insert(questionRows)

    if (sqError) {
      console.error('[quickfire/start] session questions insert failed:', sqError)
      // Rollback session
      await supabase
        .from('exam_sessions')
        .delete()
        .eq('id', session.id)
      return NextResponse.json(
        { error: 'Failed to initialize session questions' },
        { status: 500 }
      )
    }

    // Step 10 — record cooldown in background, non-blocking
    recordCooldown(userId, allWinningIds).catch(err =>
      console.error('[quickfire/start] cooldown record failed:', err)
    )

    // Step 11 — return response
    return NextResponse.json({
      session_id: session.id,
      mode: 'quick_fire',
      total_questions: questions.length,
      total_time_seconds: SESSION_TIME_SECONDS,
      started_at: session.started_at,
      expires_at: session.expires_at,
      questions
    })

  } catch (err: any) {
    console.error('[quickfire/start] error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
          }
