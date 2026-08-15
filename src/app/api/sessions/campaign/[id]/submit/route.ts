import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { submitAnswer } from '@/lib/engines/shared/answer'
import { recordExposure } from '@/lib/engines/shared/exposure'

interface AnswerSubmission {
  question_id: string
  selected_option_id: string
  time_taken_seconds: number
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: sessionId } = await params
    const body = await req.json()

    // Accept either a single answer or a bulk array
    const answers: AnswerSubmission[] = body.answers
      ? body.answers
      : [{
          question_id: body.question_id,
          selected_option_id: body.selected_option_id,
          time_taken_seconds: body.time_taken_seconds ?? 0
        }]

    if (!answers[0]?.question_id || !answers[0]?.selected_option_id) {
      return NextResponse.json(
        { error: 'question_id and selected_option_id are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const isBulk = answers.length > 1

    // ── Mark each answer server-side ────────────────────────────────
    const results = []
    for (const ans of answers) {
      const result = await submitAnswer({
        userId,
        sessionId,
        questionId: ans.question_id,
        selectedOptionId: ans.selected_option_id,
        timeTakenSeconds: ans.time_taken_seconds ?? 0
      })
      results.push({ question_id: ans.question_id, ...result })
    }

    // Increment times_seen for all answered questions
    const questionIds = answers.map(a => a.question_id)
    recordExposure(userId, questionIds, 'campaign').catch(err =>
      console.error('[campaign/submit] exposure record failed:', err)
    )

    // ── Determine if session should close ───────────────────────────
    // Bulk submit always closes immediately (timed practice)
    // Single answer only closes if it was the last unanswered question
    let shouldClose = isBulk

    if (!isBulk) {
      const { data: remaining } = await supabase
        .from('exam_session_questions')
        .select('id')
        .eq('session_id', sessionId)
        .is('selected_answer', null)

      shouldClose = !remaining || remaining.length === 0
    }

    let sessionSummary = null

    if (shouldClose) {
      const { data: allQuestions } = await supabase
        .from('exam_session_questions')
        .select('is_correct, time_spent_seconds')
        .eq('session_id', sessionId)

      const correctCount = allQuestions?.filter(q => q.is_correct).length ?? 0
      const totalTime = allQuestions?.reduce((sum, q) => sum + (q.time_spent_seconds ?? 0), 0) ?? 0
      const total = allQuestions?.length ?? 0
      const accuracyPercent = total > 0 ? (correctCount / total) * 100 : 0

      await supabase
        .from('exam_sessions')
        .update({
          status: 'submitted',
          is_completed: true,
          completed_at: new Date().toISOString(),
          submitted_at: new Date().toISOString(),
          correct_count: correctCount,
          total_time_seconds: totalTime,
          overall_accuracy_percent: accuracyPercent
        })
        .eq('id', sessionId)

      sessionSummary = {
        total_questions: total,
        correct_count: correctCount,
        accuracy_percent: accuracyPercent,
        total_time_seconds: totalTime
      }
    }

    return NextResponse.json({
      results: isBulk ? results : results[0],
      session_completed: shouldClose,
      session_summary: sessionSummary
    })

  } catch (err: any) {
    console.error('[campaign/submit] error:', err.message)

    if (err.message === 'Session not found') {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err.message === 'Session does not belong to this user') {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    if (err.message === 'Session is not active') {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    if (err.message === 'Question does not belong to this session') {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err.message === 'Question already answered') {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
  }
