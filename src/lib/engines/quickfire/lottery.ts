import { QuestionCandidate, LotteryResult } from '../shared/types'
import { computeQuickfireWeight } from './weights'
import { secureRandom } from '../shared/random'

export function runQuickfireLottery(
  candidates: QuestionCandidate[],
  subjectId: string,
  count: number
): LotteryResult {
  // Assign weights — cooldown questions get 0
  const pool = candidates.map(c => ({
    ...c,
    weight: computeQuickfireWeight(c)
  }))

  // Only eligible questions own lottery space
  const eligible = pool.filter(q => q.weight > 0)

  if (eligible.length === 0) {
    return { subject_id: subjectId, question_ids: [] }
  }

  const selectedIds: string[] = []
  const remaining = [...eligible]
  const picks = Math.min(count, remaining.length)

  for (let i = 0; i < picks; i++) {
    // Build total lottery space W
    const W = remaining.reduce((sum, q) => sum + q.weight, 0)

    // Generate secure R within W
    const R = secureRandom() * W

    // Scan cumulative until R is exceeded
    let cumulative = 0
    let winnerIdx = remaining.length - 1

    for (let j = 0; j < remaining.length; j++) {
      cumulative += remaining[j].weight
      if (R <= cumulative) {
        winnerIdx = j
        break
      }
    }

    // Record winner
    selectedIds.push(remaining[winnerIdx].id)

    // Remove from pool — no same session repeats
    remaining.splice(winnerIdx, 1)
  }

  return { subject_id: subjectId, question_ids: selectedIds }
}
