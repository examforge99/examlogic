// src/lib/examlogic/operations/sessions/createSession.ts

import { createClient } from '@/lib/supabase/server'
import type {
  CreateSessionInput,
  CreatedSession,
} from '@/lib/examlogic/domain/session'
import { ExamLogicError } from '@/lib/examlogic/runtime/errors'

const LIVE_SESSION_CONSTRAINT = 'exam_sessions_one_live_per_user_idx'

export async function createExamSession(
  input: CreateSessionInput
): Promise<CreatedSession> {
  const supabase = createClient()

  const { userId, mode, totalQuestions, timeLimitSeconds, startedAt, expiresAt, questions } = input

  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: userId,
      mode,
      status: 'active',
      is_completed: false,
      total_questions: totalQuestions,
      correct_count: 0,
      total_time_seconds: timeLimitSeconds,
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      gems_earned: 0,
      is_flagged: false,
      missed_heartbeats: 0,
      total_absence_events: 0,
      auto_submitted: false,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt?.toISOString() ?? null,
    })
    .select()
    .single()

  if (sessionError || !session) {
    if (sessionError?.code === '23505' && sessionError.message.includes(LIVE_SESSION_CONSTRAINT)) {
      throw new ExamLogicError(
        'CONFLICT',
        'You already have an active session. Complete it before starting a new one'
      )
    }

    console.error('[session/create] session insert failed:', sessionError)
    throw new ExamLogicError('INTERNAL', 'Failed to create session')
  }

  const questionRows = questions.map(question => ({
    session_id: session.id,
    question_id: question.questionId,
    subject_id: question.subjectId,
    topic_id: question.topicId,
    difficulty_level: question.difficultyLevel,
    position: question.position,
    correct_option_id: null,
    selected_answer: null,
    is_correct: null,
    time_spent_seconds: 0,
    change_count: 0,
    answer_history: [],
  }))

  const { error: questionError } = await supabase
    .from('exam_session_questions')
    .insert(questionRows)

  if (questionError) {
    console.error('[session/create] question insert failed:', questionError)
    await supabase
      .from('exam_sessions')
      .delete()
      .eq('id', session.id)

    throw new ExamLogicError('INTERNAL', 'Failed to initialize session questions')
  }

  return {
    id: session.id,
    userId,
    mode,
    status: session.status,
    totalQuestions: session.total_questions,
    totalTimeSeconds: session.total_time_seconds,
    startedAt: session.started_at,
    expiresAt: session.expires_at,
  }
}
