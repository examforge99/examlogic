import { QuestionCandidate } from '../shared/types'

// Step-down based on times_seen
// Never zero unless under cooldown
export function computeCampaignWeight(candidate: QuestionCandidate): number {
  if (candidate.under_cooldown) return 0.0

  switch (true) {
    case candidate.times_seen === 0: return 1.000
    case candidate.times_seen === 1: return 0.800
    case candidate.times_seen === 2: return 0.600
    case candidate.times_seen === 3: return 0.400
    case candidate.times_seen === 4: return 0.200
    default:                         return 0.100
  }
}
