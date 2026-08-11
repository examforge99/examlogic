import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
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
    const answers: AnswerSubmission[] = body.answers

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'answers array is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Step 1 — verify session belongs to this user, is active, correct mode
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, user_id, status, mode, total_questions')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.user_id !== userId) {
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      )
    }

    if (session.mode !== 'quick_fire') {
      return NextResponse.json(
        { error: 'This endpoint only handles quick_fire sessions' },
        { status: 400 }
      )
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 409 }
      )
    }

    // Step 2 — fetch all session questions to validate ownership + get correct answers
    const { data: sessionQuestions, error: sqError } = await supabase
      .from('exam_session_questions')
      .select('id, question_id, questions!inner(correct_option_id)')
      .eq('session_id', sessionId)

    if (sqError || !sessionQuestions) {
      return NextResponse.json(
        { error: 'Failed to load session questions' },
        { status: 500 }
      )
    }

    // Build a lookup: question_id → { session_question_id, correct_option_id }
    const questionMap = new Map(
      sessionQuestions.map(sq => [
        sq.question_id,
        {
          sessionQuestionId: sq.id,
          correctOptionId: (sq.questions as any).correct_option_id
        }
      ])
    )

    // Step 3 — validate every submitted answer belongs to this session
    for (const ans of answers) {
      if (!questionMap.has(ans.question_id)) {
        return NextResponse.json(
          { error: `Question ${ans.question_id} does not belong to this session` },
          { status: 400 }
        )
      }
    }

    // Step 4 — mark each answer, build update rows
    let correctCount = 0
    let totalTimeSeconds = 0
    let maxStreak = 0
    let currentStreak = 0

    const updateRows = answers.map(ans => {
      const q = questionMap.get(ans.question_id)!
      const isCorrect = q.correctOptionId === ans.selected_option_id

      if (isCorrect) {
        correctCount++
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }

      totalTimeSeconds += ans.time_taken_seconds ?? 0

      return {
        id: q.sessionQuestionId,
        selected_answer: ans.selected_option_id,
        correct_option_id: q.correctOptionId,
        is_correct: isCorrect,
        time_spent_seconds: ans.time_taken_seconds ?? 0
      }
    })

    // Step 5 — bulk update exam_session_questions
    const updatePromises = updateRows.map(row =>
      supabase
        .from('exam_session_questions')
        .update({
          selected_answer: row.selected_answer,
          correct_option_id: row.correct_option_id,
          is_correct: row.is_correct,
          time_spent_seconds: row.time_spent_seconds
        })
        .eq('id', row.id)
    )

    await Promise.all(updatePromises)

    // Step 6 — insert attempts for analytics
    const attemptRows = answers.map(ans => {
      const q = questionMap.get(ans.question_id)!
      return {
        session_id: sessionId,
        user_id: userId,
        question_id: ans.question_id,
        selected_option_id: ans.selected_option_id,
        correct_option_id: q.correctOptionId,
        is_correct: q.correctOptionId === ans.selected_option_id,
        time_taken_seconds: ans.time_taken_seconds ?? 0
      }
    })

    const { error: attemptError } = await supabase
      .from('attempts')
      .insert(attemptRows)

    if (attemptError) {
      console.error('[quickfire/submit] attempts insert failed:', attemptError)
    }

    // Step 7 — compute final score and update session
    const accuracyPercent = (correctCount / answers.length) * 100
    const avgTimePerQuestion = totalTimeSeconds / answers.length

    const { error: updateSessionError } = await supabase
      .from('exam_sessions')
      .update({
        status: 'submitted',
        is_completed: true,
        completed_at: new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        correct_count: correctCount,
        max_streak: maxStreak,
        total_time_seconds: totalTimeSeconds,
        overall_accuracy_percent: accuracyPercent,
        overall_avg_time_per_question: avgTimePerQuestion
      })
      .eq('id', sessionId)

    if (updateSessionError) {
      console.error('[quickfire/submit] session update failed:', updateSessionError)
      return NextResponse.json(
        { error: 'Failed to finalize session' },
        { status: 500 }
      )
    }

    // Step 8 — record exposure (quickfire_points) in background
    const questionIds = answers.map(a => a.question_id)
    recordExposure(userId, questionIds, 'quickfire').catch(err =>
      console.error('[quickfire/submit] exposure record failed:', err)
    )

    // Step 9 — return summary
    return NextResponse.json({
      session_id: sessionId,
      total_questions: answers.length,
      correct_count: correctCount,
      accuracy_percent: accuracyPercent,
      max_streak: maxStreak,
      total_time_seconds: totalTimeSeconds,
      avg_time_per_question: avgTimePerQuestion
    })

  } catch (err: any) {
    console.error('[quickfire/submit] error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
