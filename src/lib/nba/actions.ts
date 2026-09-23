import type { ActionType, Phase } from './types';

export const ACTION_MULTIPLIERS: Record<ActionType, number> = {
  READ: 1.0,
  RECALL: 0.4,
  PRACTICE: 0.6,
  REVIEW: 0.5,
  DRILL: 0.5,
  RELEARN: 0.8,
};

const PHASE_ACTIONS: Record<Phase, readonly ActionType[]> = {
  HABIT_BUILDING: ['READ', 'RECALL'],
  TRANSITION: ['RECALL', 'PRACTICE', 'REVIEW'],
  PREPARATION: ['PRACTICE', 'REVIEW', 'DRILL'],
  PERFORMANCE: ['PRACTICE', 'DRILL'],
};

export function resolveActionType(
  phase: Phase,
  attempts: number,
  score: number | null,
  days_since: number | null,
): ActionType {
  const available = PHASE_ACTIONS[phase];

  if (attempts === 0) {
    return available.includes('READ') ? 'READ' : 'PRACTICE';
  }

  if (score !== null && score < 50) {
    return phase === 'HABIT_BUILDING' || phase === 'TRANSITION'
      ? 'RELEARN'
      : 'DRILL';
  }

  if (days_since !== null && days_since > 7) {
    return available.includes('REVIEW') ? 'REVIEW' : 'PRACTICE';
  }

  return available.includes('PRACTICE') ? 'PRACTICE' : available[0];
}
