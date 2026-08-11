import { QuestionCandidate } from '../shared/types'

const CAP = 2.0

export function computeQuickfireWeight(candidate: QuestionCandidate): number {
  // Cooldown is a hard zero — owns no lottery space
  if (candidate.under_cooldown) return 0.0

  // Squared formula with cap
  const p = Math.min(candidate.quickfire_points, CAP)
  return 1 / (1 + p * p)
}
