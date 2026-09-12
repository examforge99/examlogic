// src/lib/examlogic/data/sessions.ts

import { createClient } from '@/lib/supabase/server'
import { ExamLogicError } from '@/lib/examlogic/runtime/errors'
import type { CreateSessionInput } from '@/lib/examlogic/domain/session'

const LIVE_SESSION_CONSTRAINT = 'exam_sessions_one_live_per_user_idx'
const QUESTION_COUNT_VALIDATION = 'Session question count does not match total_questions'

export async function createSession(input: CreateSessionInput) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('create_exam_session', {
    p_user_id: input.userId,
    p_mode: input.mode,
    p_status: input.initialStatus,
    p_total_questions: input.totalQuestions,
    p_time_limit_seconds: input.timeLimitSeconds,
    p_started_at: input.startedAt.toISOString(),
    p_expires_at: input.expiresAt?.toISOString() ?? null,
    p_questions: input.questions,
  })

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

    if (
      error?.code === '22023' &&
      error.message.includes(QUESTION_COUNT_VALIDATION)
    ) {
      throw new ExamLogicError('VALIDATION', QUESTION_COUNT_VALIDATION)
    }

    console.error('[sessions] atomic session creation failed:', error)
    throw new ExamLogicError('INTERNAL', 'Failed to create session')
  }

  return data
}
