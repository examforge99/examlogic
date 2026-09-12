// src/app/api/sessions/quick-fire/start/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { startQuickfire } from '@/lib/examlogic/pipelines/quickfire/startQuickfire'
import { ExamLogicError } from '@/lib/examlogic/runtime/errors'

const STATUS_BY_ERROR: Record<ExamLogicError['code'], number> = {
  UNAUTHORIZED: 401,
  CONFLICT: 409,
  NOT_FOUND: 404,
  INVALID_STATE: 400,
  RATE_LIMITED: 429,
  UNAVAILABLE: 503,
  INTERNAL: 500
}

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await startQuickfire(userId)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof ExamLogicError) {
      return NextResponse.json(
        { error: error.message },
        { status: STATUS_BY_ERROR[error.code] }
      )
    }

    console.error('[quickfire/start] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
