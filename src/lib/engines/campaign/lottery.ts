import { QuestionCandidate, LotteryResult } from '../shared/types'
import { computeCampaignWeight } from './weights'
import { secureRandom } from '../shared/random'

export function runCampaignLottery(
  candidates: QuestionCandidate[],
  subjectId: string,
  count: number
): LotteryResult {
  // Assign weights
  const pool = candidates.map(c => ({
    ...c,
    weight: computeCampaignWeight(c)
  }))

  // Only eligible questions own lottery space
  const eligible = pool.filter(q => q.weight > 0)

  if (eligible.length === 0) {
    return { subject_id: subjectId, question_ids: [] }
  }

  const selectedIds: string[] = []
  const remaining = [...eligible]

  // Return as many as possible up to count
  // Campaign pools can be small — never fail on exhaustion
  const picks = Math.min(count, remaining.length)

  for (let i = 0; i < picks; i++) {
    // Build lottery space W
    const W = remaining.reduce((sum, q) => sum + q.weight, 0)

    // Generate secure R
    const R = secureRandom() * W

    // Scan cumulative until R exceeded
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
