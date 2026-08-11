import { createClient } from '@/lib/supabase/server'
import { ServedQuestion, LotteryResult } from './types'

export async function fetchServedQuestions(
  results: LotteryResult[]
): Promise<ServedQuestion[]> {
  const supabase = createClient()

  // Flatten all winning IDs
  const allIds = results.flatMap(r => r.question_ids)

  if (allIds.length === 0) return []

  // Fetch questions with options
  // Deliberately exclude correct_option_id — never leaves server
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select(`
      id,
      topic_id,
      question_text,
      setter_difficulty,
      question_options (
        id,
        option_text,
        position
      )
    `)
    .in('id', allIds)

  if (qError) throw qError
  if (!questions) return []

  // Build subject_id lookup from results
  const subjectMap = new Map<string, string>()
  results.forEach(r => {
    r.question_ids.forEach(id => {
      subjectMap.set(id, r.subject_id)
    })
  })

  // Shape response — options sorted by position
  // Preserve lottery order per subject
  return allIds
    .map(id => {
      const q = questions.find(q => q.id === id)
      if (!q) return null

      return {
        id: q.id,
        subject_id: subjectMap.get(q.id) ?? '',
        topic_id: q.topic_id,
        question_text: q.question_text,
        setter_difficulty: q.setter_difficulty ?? 1,
        options: (q.question_options ?? [])
          .sort((a, b) => a.position - b.position)
          .map(o => ({
            id: o.id,
            option_text: o.option_text,
            position: o.position
          }))
      } as ServedQuestion
    })
    .filter(Boolean) as ServedQuestion[]
}
