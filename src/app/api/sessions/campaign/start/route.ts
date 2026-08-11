import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { fetchCandidates } from '@/lib/engines/shared/candidate'
import { fetchServedQuestions } from '@/lib/engines/shared/questions'
import { recordCooldown } from '@/lib/engines/shared/cooldown'
import { runCampaignLottery } from '@/lib/engines/campaign/lottery'
import { LotteryResult } from '@/lib/engines/shared/types'

const MAX_COUNT_PER_SUBJECT = 50
const MIN_COUNT_PER_SUBJECT = 5
const DAILY_SESSION_CAP = 20

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

    const body = await req.json()
    const {
      requests,
      time_limit_seconds
    }: {
      requests: { subject_id: string; topic_id?: string; count: number }[]
      time_limit_seconds?: number | null
    } = body

    // Step 2 — validate shape
    if (!requests || requests.length === 0) {
      return NextResponse.json(
        { error: 'requests array is required' },
        { status: 400 }
      )
    }

    for (const r of requests) {
      if (!r.subject_id) {
        return NextResponse.json(
          { error: 'subject_id is required on every request entry' },
          { status: 400 }
        )
      }
      if (!r.count || r.count < MIN_COUNT_PER_SUBJECT) {
        return NextResponse.json(
          { error: `Minimum ${MIN_COUNT_PER_SUBJECT} questions per subject` },
          { status: 400 }
        )
      }
      if (r.count > MAX_COUNT_PER_SUBJECT) {
        return NextResponse.json(
          { error: `Maximum ${MAX_COUNT_PER_SUBJECT} questions per subject` },
          { status: 400 }
        )
      }
    }

    // Step 3 — timed vs untimed rules
    const isTimed = !!time_limit_seconds

    if (!isTimed) {
      // Untimed — single subject, topic required
      if (requests.length > 1) {
        return NextResponse.json(
          { error: 'Multiple subjects only allowed in timed practice' },
          { status: 400 }
        )
      }
      if (!requests[0].topic_id) {
        return NextResponse.json(
          { error: 'Topic is required for untimed campaign practice' },
          { status: 400 }
        )
      }
    }

    if (isTimed && time_limit_seconds! < 300) {
      return NextResponse.json(
        { error: 'Minimum timed session is 5 minutes' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Step 4 — parallel preflight checks
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(
      Date.now() + 86400000
    ).toISOString().split('T')[0]

    const [userResult, activeSessionResult, rateLimitResult] =
      await Promise.all([
        supabase
          .from('users')
          .select('jamb_subjects')
          .eq('id', userId)
          .single(),

        supabase
          .from('exam_sessions')
          .select('id')
          .eq('user_id', userId)
          .in('status', ['pending', 'active'])
          .limit(1)
          .single(),

        supabase
          .from('exam_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('mode', 'campaign')
          .gte('started_at', `${today}T00:00:00Z`)
          .lt('started_at', `${tomorrow}T00:00:00Z`)
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

    // Validate active session
    const { data: activeSession } = activeSessionResult
    if (activeSession) {
      return NextResponse.json(
        { error: 'You have an active session. Complete it before starting a new one' },
        { status: 409 }
      )
    }

    // Validate daily cap
    const { count: todayCount } = rateLimitResult
    if ((todayCount ?? 0) >= DAILY_SESSION_CAP) {
      return NextResponse.json(
        { error: 'Daily campaign session limit reached. Come back tomorrow' },
        { status: 429 }
      )
    }

    // Step 5 — validate all subject_ids belong to this user
    const invalidSubject = requests.find(
      r => !user.jamb_subjects.includes(r.subject_id)
    )
    if (invalidSubject) {
      return NextResponse.json(
        { error: 'Invalid subject for this user' },
        { status: 403 }
      )
    }

    // Step 6 — if topic provided, validate it belongs to the subject
    for (const r of requests) {
      if (r.topic_id) {
        const { data: topic, error: topicError } = await supabase
          .from('topics')
          .select('id, section_id, sections!inner(subject_id)')
          .eq('id', r.topic_id)
          .single()

        if (topicError || !topic) {
          return NextResponse.json(
            { error: `Topic not found` },
            { status: 404 }
          )
        }

        const topicSubjectId = (topic.sections as any)?.subject_id
        if (topicSubjectId !== r.subject_id) {
          return NextResponse.json(
            { error: 'Topic does not belong to the selected subject' },
            { status: 400 }
          )
        }
      }
    }

    // Step 7 — run lottery per request
    const lotteryResults: LotteryResult[] = []

    for (const r of requests) {
      const candidates = await fetchCandidates(
        userId,
        r.subject_id,
        r.topic_id
      )

      const result = runCampaignLottery(
        candidates,
        r.subject_id,
        r.count
      )

      lotteryResults.push(result)
    }

    // Step 8 — collect winning IDs
    const allWinningIds = lotteryResults.flatMap(r => r.question_ids)

    if (allWinningIds.length === 0) {
      return NextResponse.json(
        { error: 'No questions available. Try a different topic or check back later' },
        { status: 503 }
      )
    }

    // Step 9 — fetch full question data
    const questions = await fetchServedQuestions(lotteryResults)

    // Step 10 — create session
    const now = new Date()
    const expiresAt = isTimed
      ? new Date(now.getTime() + time_limit_seconds! * 1000)
      : null

    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .insert({
        user_id: userId,
        mode: 'campaign',
        status: 'active',
        is_completed: false,
        total_questions: questions.length,
        correct_count: 0,
        total_time_seconds: time_limit_seconds ?? null,
        base_points: 0,
        bonus_points: 0,
        total_points: 0,
        gems_earned: 0,
        is_flagged: false,
        missed_heartbeats: 0,
        total_absence_events: 0,
        auto_submitted: false,
        started_at: now.toISOString(),
        expires_at: expiresAt?.toISOString() ?? null,
        // Store topic for untimed single topic sessions
        topic_id: !isTimed ? requests[0].topic_id : null,
        subject_id: requests.length === 1 ? requests[0].subject_id : null
      })
      .select()
      .single()

    if (sessionError || !session) {
      console.error('[campaign] session insert failed:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Step 11 — insert exam_session_questions
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
      console.error('[campaign] session questions insert failed:', sqError)
      await supabase
        .from('exam_sessions')
        .delete()
        .eq('id', session.id)
      return NextResponse.json(
        { error: 'Failed to initialize session questions' },
        { status: 500 }
      )
    }

    // Step 12 — record cooldown in background
    recordCooldown(userId, allWinningIds).catch(err =>
      console.error('[campaign] cooldown record failed:', err)
    )

    // Step 13 — return
    return NextResponse.json({
      session_id: session.id,
      mode: 'campaign',
      is_timed: isTimed,
      total_questions: questions.length,
      time_limit_seconds: time_limit_seconds ?? null,
      started_at: session.started_at,
      expires_at: session.expires_at,
      questions
    })

  } catch (err: any) {
    console.error('[campaign/start] error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
