// src/lib/examlogic/runtime/errors.ts

export type ExamLogicErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'INVALID_STATE'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'INTERNAL'

export class ExamLogicError extends Error {
  constructor(
    public readonly code: ExamLogicErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'ExamLogicError'
  }
}
