import { createClient } from '@/lib/supabase/server'
import { QuestionCandidate } from './types'

export async function fetchCandidates(
  userId: string,
  subjectId: string,
  topicId?: string
): Promise<QuestionCandidate[]> {
  const supabase = createClient()
  const now = new Date().toISOString()

  // Build base query
  // Left join user_question_seen so unseen questions still appear
  // with null state — coalesced to defaults
  let query = supabase
    .from('questions')
    .select(`
      id,
      topic_id,
      setter_difficulty,
      user_question_seen!left (
        times_seen,
        quickfire_points,
        next_eligible_at
      )
    `)
    .eq('is_active', true)

  // Scope by topic if provided, otherwise full subject pool
  // Join through topics table to get subject scope
  if (topicId) {
    query = query.eq('topic_id', topicId)
  } else {
    // Need to scope by subject — join through topics
    const { data: topicIds, error: topicError } = await supabase
      .from('topics')
      .select('id')
      .eq('section_id',
        supabase
          .from('sections')
          .select('id')
          .eq('subject_id', subjectId)
      )

    if (topicError) throw topicError

    const ids = topicIds?.map(t => t.id) ?? []
    if (ids.length === 0) return []

    query = query.in('topic_id', ids)
  }

  // Filter to only this user's state
  // The left join already handles unseen questions
  const { data, error } = await query
    .eq('user_question_seen.user_id', userId)

  if (error) throw error
  if (!data || data.length === 0) return []

  return data.map(q => {
    const state = Array.isArray(q.user_question_seen)
      ? q.user_question_seen[0]
      : q.user_question_seen

    const nextEligible = state?.next_eligible_at
      ? new Date(state.next_eligible_at)
      : null

    return {
      id: q.id,
      topic_id: q.topic_id,
      setter_difficulty: q.setter_difficulty ?? 1,
      times_seen: state?.times_seen ?? 0,
      quickfire_points: state?.quickfire_points ?? 0.0,
      under_cooldown: nextEligible
        ? nextEligible > new Date(now)
        : false
    }
  })
}
