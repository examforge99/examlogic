// src/lib/examlogic/data/sessions/sessionRepository.ts

import { createClient } from '@/lib/supabase/server'
import { ExamLogicError } from '@/lib/examlogic/runtime/errors'
import type {
  CreateSessionInput,
  SessionQuestionInput,
} from '@/lib/examlogic/domain/session'

const LIVE_SESSION_CONSTRAINT = 'exam_sessions_one_live_per_user_idx'

export async function insertSessionRecord(
  input: Omit<CreateSessionInput, 'questions'>
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('exam_sessions')
    .insert({
      user_id: input.userId,
      mode: input.mode,
      status: input.initialStatus,
      is_completed: false,
      total_questions: input.totalQuestions,
      correct_count: 0,
      total_time_seconds: input.timeLimitSeconds,
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      gems_earned: 0,
      is_flagged: false,
      missed_heartbeats: 0,
      total_absence_events: 0,
      auto_submitted: false,
      started_at: input.startedAt.toISOString(),
      expires_at: input.expiresAt?.toISOString() ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    if (
      error?.code === '23505' &&
      error.message.includes(LIVE_SESSION_CONSTRAINT)
    ) {
      throw new ExamLogicError(
        'CONFLICT',
        'You already have an active session. Complete it before starting a new one'
      )
    }

    console.error('[session/repository] session insert failed:', error)
    throw new ExamLogicError('INTERNAL', 'Failed to create session')
  }

  return data
}

export async function insertSessionQuestions(
  sessionId: string,
  questions: SessionQuestionInput[]
) {
  const supabase = createClient()

  const rows = questions.map(question => ({
    session_id: sessionId,
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

  const { error } = await supabase
    .from('exam_session_questions')
    .insert(rows)

  if (error) {
    console.error('[session/repository] question insert failed:', error)
    throw new ExamLogicError(
      'INTERNAL',
      'Failed to initialize session questions'
    )
  }
}

export async function deleteSession(sessionId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('exam_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('[session/repository] session cleanup failed:', error)
  }
}
