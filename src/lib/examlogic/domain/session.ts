// src/lib/examlogic/domain/session.ts

export type SessionMode =
  | 'quick_fire'
  | 'campaign'
  | 'simulation'
  | 'sudden_death'

export interface SessionQuestionInput {
  questionId: string
  subjectId: string
  topicId: string
  difficultyLevel: number
  position: number
}

export interface CreateSessionInput {
  userId: string
  mode: SessionMode
  totalQuestions: number
  timeLimitSeconds: number | null
  startedAt: Date
  expiresAt: Date | null
  questions: SessionQuestionInput[]
}

export interface CreatedSession {
  id: string
  userId: string
  mode: SessionMode
  status: string
  totalQuestions: number
  totalTimeSeconds: number | null
  startedAt: string
  expiresAt: string | null
}
