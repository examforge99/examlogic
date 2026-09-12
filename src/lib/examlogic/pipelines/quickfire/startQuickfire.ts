// src/lib/examlogic/pipelines/quickfire/startQuickfire.ts

import { createClient } from '@/lib/supabase/server'
import { fetchCandidates } from '@/lib/engines/shared/candidate'
import { recordCooldown } from '@/lib/engines/shared/cooldown'
import { fetchServedQuestions } from '@/lib/engines/shared/questions'
import { hasActiveSession } from '@/lib/engines/shared/session-guard'
import { runQuickfireLottery } from '@/lib/engines/quickfire/lottery'
import type { LotteryResult } from '@/lib/engines/shared/types'
import { createExamSession } from '@/lib/examlogic/operations/sessions/createSession'
import { ExamLogicError } from '@/lib/examlogic/runtime/errors'

const QUESTIONS_PER_SUBJECT = 5
const TOTAL_QUESTIONS = 20
const SESSION_TIME_SECONDS = 900
const HOURLY_SESSION_CAP = 5

export interface StartQuickfireResult {
  session_id: string
  mode: 'quick_fire'
  total_questions: number
  total_time_seconds: number
  started_at: string
  expires_at: string
  questions: Awaited<ReturnType<typeof fetchServedQuestions>>
}

export async function startQuickfire(userId: string): Promise<StartQuickfireResult> {
  const supabase = createClient()

  if (await hasActiveSession(userId)) {
    throw new ExamLogicError(
      'CONFLICT',
      'You have an active session. Complete it before starting a new one'
    )
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const [userResult, rateLimitResult] = await Promise.all([
    supabase
      .from('users')
      .select('jamb_subjects')
      .eq('id', userId)
      .single(),
    supabase
      .from('exam_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('mode', 'quick_fire')
      .gte('started_at', oneHourAgo)
  ])

  const { data: user, error: userError } = userResult
  if (userError || !user) {
    throw new ExamLogicError('NOT_FOUND', 'User not found')
  }

  if (!user.jamb_subjects?.length) {
    throw new ExamLogicError(
      'INVALID_STATE',
      'Please complete your subject selection first'
    )
  }

  if ((rateLimitResult.count ?? 0) >= HOURLY_SESSION_CAP) {
    throw new ExamLogicError(
      'RATE_LIMITED',
      'You have reached the session limit. Try again in an hour'
    )
  }

  const { data: subjects, error: subjectError } = await supabase
    .from('subjects')
    .select('id, slug, name')
    .in('slug', user.jamb_subjects)

  if (subjectError || !subjects?.length) {
    throw new ExamLogicError('UNAVAILABLE', 'Could not resolve user subjects')
  }

  const lotteryResults: LotteryResult[] = []

  for (const subject of subjects) {
    const candidates = await fetchCandidates(userId, subject.id)
    lotteryResults.push(
      runQuickfireLottery(candidates, subject.id, QUESTIONS_PER_SUBJECT)
    )
  }

  const allWinningIds = lotteryResults.flatMap(result => result.question_ids)
  if (allWinningIds.length < TOTAL_QUESTIONS) {
    throw new ExamLogicError(
      'UNAVAILABLE',
      'Not enough questions available. Try again later'
    )
  }

  const questions = await fetchServedQuestions(lotteryResults)
  if (questions.length < TOTAL_QUESTIONS) {
    throw new ExamLogicError(
      'UNAVAILABLE',
      'Not enough questions available. Try again later'
    )
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TIME_SECONDS * 1000)

  const session = await createExamSession({
    userId,
    mode: 'quick_fire',
    initialStatus: 'active',
    totalQuestions: questions.length,
    timeLimitSeconds: SESSION_TIME_SECONDS,
    startedAt: now,
    expiresAt,
    questions: questions.map((question, index) => ({
      questionId: question.id,
      subjectId: question.subject_id,
      topicId: question.topic_id,
      difficultyLevel: question.setter_difficulty,
      position: index + 1
    }))
  })

  // Cooldown is intentionally non-blocking, preserving the current behavior.
  recordCooldown(userId, allWinningIds).catch(error =>
    console.error('[quickfire/start] cooldown record failed:', error)
  )

  return {
    session_id: session.id,
    mode: 'quick_fire',
    total_questions: questions.length,
    total_time_seconds: SESSION_TIME_SECONDS,
    started_at: session.startedAt,
    expires_at: session.expiresAt!,
    questions
  }
}
