// lib/simulation/engines/topicDifficultyAllocator.ts

export interface TopicDemand {
  topicId: string;
  subjectId: string;
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
  total: number;
  pointBudget: number;
}

export interface SubjectBlueprint {
  subjectId: string;
  questionCount: number;
  topics: TopicDemand[];
  expectedAverage: number;
}

export async function allocateTopicDifficulty(
  difficultyTemplate: any,
  topicTemplate: any,
  subjectId: string
): Promise<SubjectBlueprint> {
  const questionCount = difficultyTemplate.question_count;
  const topicIds: string[] = topicTemplate.topic_ids;

  const topicAllocations = resolveQuestionCountPerTopic(topicIds, questionCount);
  const withBreakdowns = resolveDifficultyBreakdownPerTopic(topicAllocations, difficultyTemplate.difficulty_distribution);
  const withRounding = resolveRoundingErrors(withBreakdowns);
  const withBudgets = computePointBudgetPerTopic(withRounding, subjectId);

  validateBlueprintAverage(withBudgets, questionCount);

  return {
    subjectId,
    questionCount,
    topics: withBudgets,
    expectedAverage: difficultyTemplate.target_average,
  };
}

export function resolveQuestionCountPerTopic(
  topicIds: string[],
  questionCount: number
): { topicId: string; total: number }[] {
  const base = Math.floor(questionCount / topicIds.length);
  const remainder = questionCount % topicIds.length;

  return topicIds.map((topicId, i) => ({
    topicId,
    total: i < remainder ? base + 1 : base,
  }));
}

export function resolveDifficultyBreakdownPerTopic(
  topicAllocations: { topicId: string; total: number }[],
  dist: any
): { topicId: string; total: number; level1: number; level2: number; level3: number; level4: number; level5: number }[] {
  return topicAllocations.map(({ topicId, total }) => ({
    topicId,
    total,
    level1: Math.floor((dist.level1_percent / 100) * total),
    level2: Math.floor((dist.level2_percent / 100) * total),
    level3: Math.floor((dist.level3_percent / 100) * total),
    level4: Math.floor((dist.level4_percent / 100) * total),
    level5: Math.floor((dist.level5_percent / 100) * total),
  }));
}

export function resolveRoundingErrors(
  topics: { topicId: string; total: number; level1: number; level2: number; level3: number; level4: number; level5: number }[]
) {
  return topics.map((topic) => {
    const assigned = topic.level1 + topic.level2 + topic.level3 + topic.level4 + topic.level5;
    const remainder = topic.total - assigned;
    return { ...topic, level3: topic.level3 + remainder };
  });
}

export function computePointBudgetPerTopic(
  topics: { topicId: string; total: number; level1: number; level2: number; level3: number; level4: number; level5: number }[],
  subjectId: string
): TopicDemand[] {
  return topics.map((topic) => ({
    ...topic,
    subjectId,
    pointBudget:
      topic.level1 * 1 +
      topic.level2 * 2 +
      topic.level3 * 3 +
      topic.level4 * 4 +
      topic.level5 * 5,
  }));
}

export function validateBlueprintAverage(
  topics: TopicDemand[],
  questionCount: number
): void {
  const totalPoints = topics.reduce((sum, t) => sum + t.pointBudget, 0);
  const average = totalPoints / questionCount;

  if (average < 3.3 || average > 3.7) {
    throw new Error(`Blueprint average ${average.toFixed(2)} out of tolerance (3.30–3.70)`);
  }
}
