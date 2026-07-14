// lib/simulation/scoring/pointsEngine.ts

export const RANK_THRESHOLDS: Record<string, number> = {
  unranked:  0,
  bronze:    500,
  silver:    2000,
  gold:      6000,
  platinum:  14000,
  diamond:   30000,
  master:    55000,
  legend:    80000,
};

export const RANK_MULTIPLIERS: Record<string, number> = {
  unranked:  1.0,
  bronze:    1.3,
  silver:    1.6,
  gold:      2.0,
  platinum:  2.6,
  diamond:   3.2,
  master:    4.0,
  legend:    5.0,
};

const SPEED_BONUS: Record<number, { threshold: number; bonus: number }> = {
  1: { threshold: 20, bonus: 0.5 },
  2: { threshold: 30, bonus: 0.5 },
  3: { threshold: 45, bonus: 1.0 },
  4: { threshold: 60, bonus: 1.5 },
  5: { threshold: 90, bonus: 2.0 },
};

const ACCURACY_BONUS: { threshold: number; bonus: number }[] = [
  { threshold: 90, bonus: 15 },
  { threshold: 75, bonus: 10 },
  { threshold: 60, bonus: 5 },
];

const ACCURACY_PENALTY: { threshold: number; penalty: number }[] = [
  { threshold: 10, penalty: 40 },
  { threshold: 20, penalty: 20 },
  { threshold: 30, penalty: 10 },
];

const STREAK_BONUS: { threshold: number; bonus: number }[] = [
  { threshold: 20, bonus: 30 },
  { threshold: 15, bonus: 20 },
  { threshold: 10, bonus: 12 },
  { threshold: 5,  bonus: 5 },
];

const COMPLETION_BONUS = 20;
const POOR_PERFORMANCE_THRESHOLD = 30; // % accuracy
const CONSECUTIVE_POOR_SESSIONS_FOR_DEMOTION = 3;

export interface QuestionScore {
  question_id: string;
  subject_id: string;
  topic_id: string;
  difficulty_level: number;
  is_correct: boolean;
  time_spent_seconds: number;
}

export interface PointsBreakdown {
  base_points: number;
  speed_bonus: number;
  accuracy_bonus: number;
  streak_bonus: number;
  completion_bonus: number;
  accuracy_penalty: number;
  raw_total: number;
  rank_multiplier: number;
  total_points: number;        // can be negative
  is_poor_performance: boolean;
}

export function computeSessionPoints(
  questions: QuestionScore[],
  currentRankTier: string,
  autoSubmitted: boolean
): PointsBreakdown {
  const multiplier = RANK_MULTIPLIERS[currentRankTier] ?? 1.0;
  const totalQuestions = questions.length;
  const correctCount = questions.filter((q) => q.is_correct).length;
  const accuracyPercent = totalQuestions > 0
    ? (correctCount / totalQuestions) * 100
    : 0;

  const isPoorPerformance = accuracyPercent < POOR_PERFORMANCE_THRESHOLD;

  // ── Base points ────────────────────────────────────────────────────────
  let base_points = 0;
  for (const q of questions) {
    if (q.is_correct) base_points += q.difficulty_level;
  }

  // ── Speed bonus ────────────────────────────────────────────────────────
  let speed_bonus = 0;
  for (const q of questions) {
    if (!q.is_correct) continue;
    const rule = SPEED_BONUS[q.difficulty_level];
    if (rule && q.time_spent_seconds <= rule.threshold) {
      speed_bonus += rule.bonus;
    }
  }

  // ── Accuracy bonus per subject ─────────────────────────────────────────
  const subjectMap = new Map<string, { correct: number; total: number }>();
  for (const q of questions) {
    const s = subjectMap.get(q.subject_id) ?? { correct: 0, total: 0 };
    subjectMap.set(q.subject_id, {
      correct: s.correct + (q.is_correct ? 1 : 0),
      total: s.total + 1,
    });
  }

  let accuracy_bonus = 0;
  for (const [, data] of subjectMap.entries()) {
    const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    const rule = ACCURACY_BONUS.find((r) => accuracy >= r.threshold);
    if (rule) accuracy_bonus += rule.bonus;
  }

  // ── Accuracy penalty — overall session ────────────────────────────────
  let accuracy_penalty = 0;
  if (isPoorPerformance) {
    const penaltyRule = ACCURACY_PENALTY.find(
      (r) => accuracyPercent < r.threshold
    );
    if (penaltyRule) accuracy_penalty = penaltyRule.penalty;
  }

  // ── Streak bonus ───────────────────────────────────────────────────────
  let streak_bonus = 0;
  let currentStreak = 0;
  let maxStreak = 0;

  for (const q of questions) {
    if (q.is_correct) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  const streakRule = STREAK_BONUS.find((r) => maxStreak >= r.threshold);
  if (streakRule) streak_bonus = streakRule.bonus;

  // ── Completion bonus ───────────────────────────────────────────────────
  const completion_bonus = autoSubmitted ? 0 : COMPLETION_BONUS;

  // ── Apply rank multiplier ──────────────────────────────────────────────
  // Penalty is also multiplied — higher rank loses more for poor performance
  const raw_total =
    base_points +
    speed_bonus +
    accuracy_bonus +
    streak_bonus +
    completion_bonus -
    accuracy_penalty;

  const total_points = Math.floor(raw_total * multiplier);

  return {
    base_points,
    speed_bonus,
    accuracy_bonus,
    streak_bonus,
    completion_bonus,
    accuracy_penalty,
    raw_total,
    rank_multiplier: multiplier,
    total_points,
    is_poor_performance: isPoorPerformance,
  };
}

export function computeNewRankTier(
  currentTotalPoints: number,
  currentTier: string,
  consecutivePoorSessions: number
): string {
  // Sustained poor performance breaks floor protection — demote one tier
  if (consecutivePoorSessions >= CONSECUTIVE_POOR_SESSIONS_FOR_DEMOTION) {
    return demoteTier(currentTier);
  }

  // Normal rank computation — floor protected
  const tierFloor = RANK_THRESHOLDS[currentTier] ?? 0;
  const effectivePoints = Math.max(currentTotalPoints, tierFloor);

  const tiers = Object.entries(RANK_THRESHOLDS).sort((a, b) => b[1] - a[1]);

  for (const [tier, threshold] of tiers) {
    if (effectivePoints >= threshold) return tier;
  }

  return "unranked";
}

export function demoteTier(currentTier: string): string {
  const tierOrder = [
    "unranked",
    "bronze",
    "silver",
    "gold",
    "platinum",
    "diamond",
    "master",
    "legend",
  ];

  const index = tierOrder.indexOf(currentTier);
  if (index <= 0) return "unranked";
  return tierOrder[index - 1];
}

export function getPointsToNextRank(
  currentTotalPoints: number,
  currentTier: string
): { nextTier: string | null; pointsNeeded: number } {
  const tiers = Object.entries(RANK_THRESHOLDS).sort((a, b) => a[1] - b[1]);
  const currentIndex = tiers.findIndex(([tier]) => tier === currentTier);

  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return { nextTier: null, pointsNeeded: 0 };
  }

  const [nextTier, nextThreshold] = tiers[currentIndex + 1];
  return {
    nextTier,
    pointsNeeded: Math.max(0, nextThreshold - currentTotalPoints),
  };
}
