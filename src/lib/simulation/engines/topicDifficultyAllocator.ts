// lib/simulation/engines/topicDifficultyAllocator.ts

import { SupabaseClient } from "@supabase/supabase-js";

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

  // Step 1 — resolve question count per topic
  const topicAllocations = resolveQuestionCountPerTopic(topicIds, questionCount);

  // Step 2 — resolve difficulty breakdown per topic
  const topics = resolveDifficultyBreakdownPerTopic(
    topicAllocations,
    difficultyTemplate.difficulty_distribution
  );

  // Step 3 — fix rounding errors
  const resolved = resolveRoundingErrors(topics, difficultyTemplate.difficulty_distribution, questionCount);

  // Step 4 — compute point budget per topic
  const withBudgets = computePointBudgetPerTopic(resolved);

  // Step 5 — validate
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
    total: i < remainder ? base + 1 : base, // distribute remainder to first N topics
  }));
}

export function resolveDifficultyBreakdownPerTopic(
  topicAllocations: { topicId: string; total: number }[],
  difficultyDistribution: any
): Omit<TopicDemand, "subjectId" | "pointBudget">[] {
  return topicAllocations.map(({ topicId, total }) => {
    const l1 = Math.floor((difficultyDistribution.level1_percent / 100) * total);
    const l2 = Math.floor((difficultyDistribution.level2_percent / 100) * total);
    const l3 = Math.floor((difficultyDistribution.level3_percent / 100) * total);
    const l4 = Math.floor((difficultyDistribution.level4_percent / 100) * total);
    const l5 = Math.floor((difficultyDistribution.level5_percent / 100) * total);

    return { topicId, total, level1: l1, level2: l2, level3: l3, level4: l4, level5: l5 };
  });
}

export function resolveRoundingErrors(
  topics: Omit<TopicDemand, "subjectId" | "pointBudget">[],
  difficultyDistribution: any,
  questionCount: number
): Omit<TopicDemand, "subjectId" | "pointBudget">[] {
  return topics.map((topic) => {
    const assigned = topic.level1 + topic.level2 + topic.level3 + topic.level4 + topic.level5;
    const remainder = topic.total - assigned;
    // Remainder absorbs into level3 (dominant tier)
    return { ...topic, level3: topic.level3 + remainder };
  });
}

export function computePointBudgetPerTopic(
  topics: Omit<TopicDemand, "subjectId" | "pointBudget">[]
): Omit<TopicDemand, "subjectId">[] {
  return topics.map((topic) => {
    const pointBudget =
      topic.level1 * 1 +
      topic.level2 * 2 +
      topic.level3 * 3 +
      topic.level4 * 4 +
      topic.level5 * 5;

    return { ...topic, pointBudget };
  });
}

export function validateBlueprintAverage(
  topics: Omit<TopicDemand, "subjectId">[],
  questionCount: number
): void {
  const totalPoints = topics.reduce((sum, t) => sum + t.pointBudget, 0);
  const average = totalPoints / questionCount;

  if (average < 3.3 || average > 3.7) {
    throw new Error(
      `Blueprint average ${average.toFixed(2)} out of tolerance (3.30–3.70)`
    );
  }
}
