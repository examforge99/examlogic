import { createClient } from '@/lib/supabase/server'
import { secureRandom } from '../shared/random'
import { largestRemainderAllocate } from './largest-remainder'
import { TopicCandidate, TopicAllocation } from './types'

const MIN_TOPIC_PERCENT = 0.4
const MAX_TOPIC_PERCENT = 0.7

// Fetch all topics for a subject with their live question counts
async function fetchSubjectTopics(subjectId: string): Promise<TopicCandidate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('topics')
    .select('id, question_count, sections!inner(subject_id)')
    .eq('sections.subject_id', subjectId)
    .eq('status', 'active')
    .gt('question_count', 0)

  if (error) throw error
  if (!data) return []

  return data.map(t => ({
    id: t.id,
    question_count: t.question_count
  }))
}

// Weighted lottery — pick N topics without replacement, weight = question_count
function pickTopicsWeighted(
  topics: TopicCandidate[],
  count: number
): TopicCandidate[] {
  const pool = [...topics]
  const selected: TopicCandidate[] = []

  const picks = Math.min(count, pool.length)

  for (let i = 0; i < picks; i++) {
    const W = pool.reduce((sum, t) => sum + t.question_count, 0)
    const R = secureRandom() * W

    let cumulative = 0
    let winnerIdx = pool.length - 1

    for (let j = 0; j < pool.length; j++) {
      cumulative += pool[j].question_count
      if (R <= cumulative) {
        winnerIdx = j
        break
      }
    }

    selected.push(pool[winnerIdx])
    pool.splice(winnerIdx, 1)
  }

  return selected
}

export async function planTopicAllocations(
  subjectId: string,
  totalQuestions: number,
  difficultyPercents: number[] // [level1%, level2%, level3%, level4%, level5%] as decimals
): Promise<TopicAllocation[]> {
  const allTopics = await fetchSubjectTopics(subjectId)

  if (allTopics.length === 0) {
    return []
  }

  // Step 1 — determine topic scope range
  const minTopics = Math.max(1, Math.ceil(allTopics.length * MIN_TOPIC_PERCENT))
  const maxTopics = Math.max(minTopics, Math.floor(allTopics.length * MAX_TOPIC_PERCENT))
  const topicCount = minTopics + Math.floor(secureRandom() * (maxTopics - minTopics + 1))

  // Step 2 — weighted lottery selects which topics are in play
  const selectedTopics = pickTopicsWeighted(allTopics, topicCount)

  // Step 3 — distribute totalQuestions across selected topics, weighted by question_count
  const topicWeights = selectedTopics.map(
    t => t.question_count / selectedTopics.reduce((s, x) => s + x.question_count, 0)
  )
  const topicSlots = largestRemainderAllocate(topicWeights, totalQuestions)

  // Step 4 — within each topic's slots, apply difficulty shape
  const allocations: TopicAllocation[] = selectedTopics.map((topic, idx) => {
    const slots = topicSlots[idx]
    const splitCounts = largestRemainderAllocate(difficultyPercents, slots)

    const difficulty_split: Record<number, number> = {}
    splitCounts.forEach((count, levelIdx) => {
      difficulty_split[levelIdx + 1] = count
    })

    return {
      topic_id: topic.id,
      slots,
      difficulty_split
    }
  })

  return allocations.filter(a => a.slots > 0)
}
