// lib/engines/quickfire/weights.ts

import { QuestionCandidate } from '../shared/types'

const CAP = 2.0

export function computeQuickfireWeight(candidate: QuestionCandidate): number {
  if (candidate.under_cooldown) return 0.0

  const p = Math.min(candidate.quickfire_points, CAP)
  return 1 / (1 + p * p)
}
