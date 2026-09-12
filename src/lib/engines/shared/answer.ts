import { createClient } from '@/lib/supabase/server'

export interface SubmitAnswerParams {
  userId: string
  sessionId: string
  questionId: string
  selectedOptionId: string
  timeTakenSeconds: number
}

export interface SubmitAnswerResult {
  is_correct: boolean
  correct_option_id: string
  selected_option_id: string
}

export async function submitAnswer(
  params: SubmitAnswerParams
): Promise<SubmitAnswerResult> {
  const { userId, sessionId, questionId, selectedOptionId, timeTakenSeconds } = params
  const supabase = createClient()

  if (!Number.isFinite(timeTakenSeconds) || timeTakenSeconds < 0) {
    throw new Error('Invalid answer time')
  }

  // Step 1 — verify session belongs to this user and is active.
  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .select('id, user_id, status, mode')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    throw new Error('Session not found')
  }

  if (session.user_id !== userId) {
    throw new Error('Session does not belong to this user')
  }

  if (session.status !== 'active') {
    throw new Error('Session is not active')
  }

  // Step 2 — verify this question belongs to this session.
  const { data: sessionQuestion, error: sqError } = await supabase
    .from('exam_session_questions')
    .select('id, question_id, selected_answer')
    .eq('session_id', sessionId)
    .eq('question_id', questionId)
    .single()

  if (sqError || !sessionQuestion) {
    throw new Error('Question does not belong to this session')
  }

  // Step 3 — fetch the real correct answer server-side.
  const { data: question, error: qError } = await supabase
    .from('questions')
    .select('correct_option_id')
    .eq('id', questionId)
    .single()

  if (qError || !question) {
    throw new Error('Question not found')
  }

  const isCorrect = question.correct_option_id === selectedOptionId

  // Step 4 — atomically claim the unanswered question.
  // Concurrent requests may both pass the reads above, but only one
  // can update a row whose selected_answer is still NULL.
  const { data: claimedQuestion, error: updateError } = await supabase
    .from('exam_session_questions')
    .update({
      selected_answer: selectedOptionId,
      correct_option_id: question.correct_option_id,
      is_correct: isCorrect,
      time_spent_seconds: timeTakenSeconds
    })
    .eq('id', sessionQuestion.id)
    .is('selected_answer', null)
    .select('id')
    .maybeSingle()

  if (updateError) {
    throw new Error('Failed to record answer')
  }

  if (!claimedQuestion) {
    throw new Error('Question already answered')
  }

  // Step 5 — analytics is recorded only by the request that successfully
  // claimed the unanswered question, preventing duplicate attempts on replay.
  const { error: attemptError } = await supabase
    .from('attempts')
    .insert({
      session_id: sessionId,
      user_id: userId,
      question_id: questionId,
      selected_option_id: selectedOptionId,
      correct_option_id: question.correct_option_id,
      is_correct: isCorrect,
      time_taken_seconds: timeTakenSeconds,
      question_order: null
    })

  if (attemptError) {
    console.error('[answer] attempts insert failed:', attemptError)
  }

  return {
    is_correct: isCorrect,
    correct_option_id: question.correct_option_id,
    selected_option_id: selectedOptionId
  }
}
