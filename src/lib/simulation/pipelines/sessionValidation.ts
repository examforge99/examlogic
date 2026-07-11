// lib/simulation/pipelines/sessionValidation.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { ResolvedCandidatePool, ResolvedQuestion } from "@/lib/simulation/pipelines/constraintResolution";
import { SubjectBlueprint } from "@/lib/simulation/engines/topicDifficultyAllocator";
import { notifyExcessiveResolution } from "@/lib/simulation/notifications/adminNotifier";

const EXCESSIVE_RESOLUTION_THRESHOLD = 5;
const MIN_TOPICS_PER_SUBJECT = 3;
const MAX_TOPIC_CONCENTRATION = 0.4; // no single topic > 40% of subject questions

export interface ValidationCheck {
  name: string;
  passed: boolean;
  reason?: string;
}

export interface ValidationReport {
  passed: boolean;
  checks: ValidationCheck[];
  resolutionCount: number;
}

export async function validateSession(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  resolvedPool: ResolvedCandidatePool,
  blueprints: SubjectBlueprint[]
): Promise<ValidationReport> {
  const checks: ValidationCheck[] = [];

  checks.push(validateQuestionCount(resolvedPool.questions));
  checks.push(validateNoDuplicates(resolvedPool.questions));
  checks.push(validateGlobalAverage(resolvedPool.questions));
  checks.push(...validatePerSubjectAverage(resolvedPool.questions, blueprints));
  checks.push(validateTopicConcentration(resolvedPool.questions, blueprints));
  checks.push(validateMinimumTopicCount(resolvedPool.questions, blueprints));
  checks.push(validateResolutionCount(resolvedPool.resolutionCount));

  const passed = checks.every((c) => c.passed);

  // Tier 1 alert — session created but excessive resolution happened
  if (passed && resolvedPool.resolutionCount > EXCESSIVE_RESOLUTION_THRESHOLD) {
    const subjectsAffected = [
      ...new Set(resolvedPool.diagnostics.substitutions.map((s) => s.slotKey.split(":")[0])),
    ];

    await notifyExcessiveResolution(
      supabase,
      sessionId,
      userId,
      resolvedPool.resolutionCount,
      subjectsAffected
    );
  }

  return buildValidationReport(checks, resolvedPool.resolutionCount);
}

export function validateQuestionCount(questions: ResolvedQuestion[]): ValidationCheck {
  return {
    name: "question_count",
    passed: questions.length === 180,
    reason: questions.length !== 180
      ? `Expected 180 questions, got ${questions.length}`
      : undefined,
  };
}

export function validateNoDuplicates(questions: ResolvedQuestion[]): ValidationCheck {
  const ids = questions.map((q) => q.id);
  const unique = new Set(ids);

  return {
    name: "no_duplicates",
    passed: unique.size === ids.length,
    reason: unique.size !== ids.length
      ? `Found ${ids.length - unique.size} duplicate question(s)`
      : undefined,
  };
}

export function validateGlobalAverage(questions: ResolvedQuestion[]): ValidationCheck {
  const total = questions.reduce((sum, q) => sum + q.difficulty_level, 0);
  const average = total / questions.length;
  const passed = average >= 3.3 && average <= 3.7;

  return {
    name: "global_average",
    passed,
    reason: !passed
      ? `Global average ${average.toFixed(2)} out of tolerance (3.30–3.70)`
      : undefined,
  };
}

export function validatePerSubjectAverage(
  questions: ResolvedQuestion[],
  blueprints: SubjectBlueprint[]
): ValidationCheck[] {
  return blueprints.map((blueprint) => {
    const subjectQuestions = questions.filter((q) => q.subject_id === blueprint.subjectId);
    const total = subjectQuestions.reduce((sum, q) => sum + q.difficulty_level, 0);
    const average = subjectQuestions.length > 0 ? total / subjectQuestions.length : 0;
    const passed = average >= 3.3 && average <= 3.7;

    return {
      name: `per_subject_average:${blueprint.subjectId}`,
      passed,
      reason: !passed
        ? `Subject ${blueprint.subjectId} average ${average.toFixed(2)} out of tolerance`
        : undefined,
    };
  });
}

export function validateTopicConcentration(
  questions: ResolvedQuestion[],
  blueprints: SubjectBlueprint[]
): ValidationCheck {
  for (const blueprint of blueprints) {
    const subjectQuestions = questions.filter((q) => q.subject_id === blueprint.subjectId);
    const topicCounts = new Map<string, number>();

    for (const q of subjectQuestions) {
      topicCounts.set(q.topic_id, (topicCounts.get(q.topic_id) ?? 0) + 1);
    }

    for (const [topicId, count] of topicCounts.entries()) {
      const concentration = count / subjectQuestions.length;
      if (concentration > MAX_TOPIC_CONCENTRATION) {
        return {
          name: "topic_concentration",
          passed: false,
          reason: `Topic ${topicId} in subject ${blueprint.subjectId} has ${(concentration * 100).toFixed(1)}% concentration (max 40%)`,
        };
      }
    }
  }

  return { name: "topic_concentration", passed: true };
}

export function validateMinimumTopicCount(
  questions: ResolvedQuestion[],
  blueprints: SubjectBlueprint[]
): ValidationCheck {
  for (const blueprint of blueprints) {
    const subjectQuestions = questions.filter((q) => q.subject_id === blueprint.subjectId);
    const uniqueTopics = new Set(subjectQuestions.map((q) => q.topic_id));

    if (uniqueTopics.size < MIN_TOPICS_PER_SUBJECT) {
      return {
        name: "minimum_topic_count",
        passed: false,
        reason: `Subject ${blueprint.subjectId} has only ${uniqueTopics.size} topic(s), minimum is ${MIN_TOPICS_PER_SUBJECT}`,
      };
    }
  }

  return { name: "minimum_topic_count", passed: true };
}

export function validateResolutionCount(resolutionCount: number): ValidationCheck {
  return {
    name: "resolution_count",
    passed: resolutionCount <= EXCESSIVE_RESOLUTION_THRESHOLD,
    reason: resolutionCount > EXCESSIVE_RESOLUTION_THRESHOLD
      ? `Resolution count ${resolutionCount} exceeds threshold ${EXCESSIVE_RESOLUTION_THRESHOLD}`
      : undefined,
  };
}

export function buildValidationReport(
  checks: ValidationCheck[],
  resolutionCount: number
): ValidationReport {
  return {
    passed: checks.every((c) => c.passed),
    checks,
    resolutionCount,
  };
}
