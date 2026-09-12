// src/lib/examlogic/domain/session.ts

export type SessionMode =
  | 'quick_fire'
  | 'campaign'
  | 'simulation'
  | 'sudden_death'

export type SessionStatus =
  | 'pending'
  | 'active'
  | 'submitted'
  | 'scored'
  | 'terminated'

export type InitialSessionStatus = 'pending' | 'active'

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
  initialStatus: InitialSessionStatus
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
  status: SessionStatus
  totalQuestions: number
  totalTimeSeconds: number | null
  startedAt: string
  expiresAt: string | null
}
