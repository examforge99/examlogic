// src/lib/examlogic/operations/sessions/createSession.ts

import type {
  CreateSessionInput,
  CreatedSession,
} from '@/lib/examlogic/domain/session'
import { ExamLogicError } from '@/lib/examlogic/runtime/errors'
import {
  deleteSession,
  insertSessionQuestions,
  insertSessionRecord,
} from '@/lib/examlogic/data/sessions/sessionRepository'

export async function createExamSession(
  input: CreateSessionInput
): Promise<CreatedSession> {
  if (input.questions.length !== input.totalQuestions) {
    throw new ExamLogicError(
      'VALIDATION',
      'Session question count does not match total_questions'
    )
  }

  const session = await insertSessionRecord(input)

  try {
    await insertSessionQuestions(session.id, input.questions)
  } catch (error) {
    await deleteSession(session.id)
    throw error
  }

  return {
    id: session.id,
    userId: input.userId,
    mode: input.mode,
    status: session.status,
    totalQuestions: session.total_questions,
    totalTimeSeconds: session.total_time_seconds,
    startedAt: session.started_at,
    expiresAt: session.expires_at,
  }
}
