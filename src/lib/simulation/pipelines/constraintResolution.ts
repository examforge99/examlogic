// lib/simulation/pipelines/constraintResolution.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { ScoredCandidatePool, ScoredCandidate } from "@/lib/simulation/pipelines/candidateScoring";
import { SubjectBlueprint } from "@/lib/simulation/engines/topicDifficultyAllocator";
import { notifyGenerationFailure } from "@/lib/simulation/notifications/adminNotifier";
import {
  initializePointBudget,
  debitPointBudget,
  creditPointBudget,
  checkBudgetTolerance,
  isBudgetAtFloor,
  isBudgetAtCeiling,
  PointBudget,
} from "@/lib/simulation/helpers/pointBudget";

export interface ResolvedQuestion extends ScoredCandidate {
  position?: number;
  resolutionLevel?: number; // which level of cascade resolved this slot
}

export interface ResolvedCandidatePool {
  questions: ResolvedQuestion[];
  resolutionCount: number;
  diagnostics: ResolutionDiagnostics;
}

export interface ResolutionDiagnostics {
  slotsResolved: number;
  substitutions: { slotKey: string; level: number; reason: string }[];
  hardStop: boolean;
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

export async function resolveConstraints(
  supabase: SupabaseClient,
  userId: string,
  scoredPool: ScoredCandidatePool,
  blueprints: SubjectBlueprint[]
): Promise<ResolvedCandidatePool> {
  const resolved: ResolvedQuestion[] = [];
  const diagnostics: ResolutionDiagnostics = {
    slotsResolved: 0,
    substitutions: [],
    hardStop: false,
  };

  // Build budget per subject
  const budgets = new Map<string, PointBudget>();
  for (const blueprint of blueprints) {
    budgets.set(blueprint.subjectId, initializePointBudget(blueprint));
  }

  for (const { slot, candidates } of scoredPool.slots) {
    const slotKey = `${slot.subjectId}:${slot.topicId}:L${slot.level}`;
    const budget = budgets.get(slot.subjectId)!;

    // Level 1 — take top candidates by score
    if (candidates.length >= slot.demand) {
      const picked = candidates.slice(0, slot.demand);
      picked.forEach((q) => resolved.push({ ...q, resolutionLevel: 1 }));
      debitPointBudget(budget, slot.level * slot.demand);
      diagnostics.slotsResolved++;
      continue;
    }

    // Level 2 — partial fill, redistribute shortfall within topic
    if (candidates.length > 0 && candidates.length < slot.demand) {
      const shortfall = slot.demand - candidates.length;
      candidates.forEach((q) => resolved.push({ ...q, resolutionLevel: 2 }));
      debitPointBudget(budget, slot.level * candidates.length);

      const redistributed = await redistributeTopicShortfall(
        supabase,
        shortfall,
        slot,
        scoredPool,
        budget
      );

      redistributed.forEach((q) => resolved.push({ ...q, resolutionLevel: 2 }));
      diagnostics.substitutions.push({ slotKey, level: 2, reason: "partial_fill_redistributed" });
      diagnostics.slotsResolved++;
      continue;
    }

    // Level 3 — slot completely empty, substitute adjacent difficulty
    if (candidates.length === 0) {
      const substituted = await substituteAdjacentDifficulty(
        supabase,
        slot,
        scoredPool,
        budget
      );

      if (substituted.length > 0) {
        substituted.forEach((q) => resolved.push({ ...q, resolutionLevel: 3 }));
        diagnostics.substitutions.push({ slotKey, level: 3, reason: "adjacent_difficulty_substituted" });
        diagnostics.slotsResolved++;
        continue;
      }
    }

    // Level 4 — replace topic within subject
    const usedTopicIds = blueprints
      .find((b) => b.subjectId === slot.subjectId)!
      .topics.map((t) => t.topicId);

    const topicReplacement = await replaceTopic(
      supabase,
      slot,
      scoredPool,
      usedTopicIds,
      budget
    );

    if (topicReplacement.length > 0) {
      topicReplacement.forEach((q) => resolved.push({ ...q, resolutionLevel: 4 }));
      diagnostics.substitutions.push({ slotKey, level: 4, reason: "topic_replaced" });
      diagnostics.slotsResolved++;
      continue;
    }

    // Level 5 — compensate cross-subject
    const crossSubjectFill = await compensateCrossSubject(
      supabase,
      slot,
      blueprints,
      budgets,
      scoredPool
    );

    if (crossSubjectFill.length > 0) {
      crossSubjectFill.forEach((q) => resolved.push({ ...q, resolutionLevel: 5 }));
      diagnostics.substitutions.push({ slotKey, level: 5, reason: "cross_subject_compensated" });
      diagnostics.slotsResolved++;
      continue;
    }

    // Level 6 — regenerate subject blueprint
    const regenerated = await regenerateSubjectBlueprint(
      supabase,
      slot.subjectId,
      blueprints,
      scoredPool,
      budget
    );

    if (regenerated.length > 0) {
      regenerated.forEach((q) => resolved.push({ ...q, resolutionLevel: 6 }));
      diagnostics.substitutions.push({ slotKey, level: 6, reason: "blueprint_regenerated" });
      diagnostics.slotsResolved++;
      continue;
    }

    // Level 7 — retry full session
    const retried = await retryFullSession(supabase, userId, scoredPool);

    if (retried.length > 0) {
      retried.forEach((q) => resolved.push({ ...q, resolutionLevel: 7 }));
      diagnostics.substitutions.push({ slotKey, level: 7, reason: "full_session_retried" });
      diagnostics.slotsResolved++;
      continue;
    }

    // Level 8 — hard stop
    diagnostics.hardStop = true;
    const failureCause = await detectFailureCause(supabase, userId, slot.subjectId);
    await handleHardStop(supabase, userId, { slotKey, failureCause, diagnostics });

    return {
      questions: [],
      resolutionCount: diagnostics.substitutions.length,
      diagnostics,
    };
  }

  // Budget tolerance check after all slots resolved
  for (const [subjectId, budget] of budgets.entries()) {
    if (!checkBudgetTolerance(budget)) {
      await compensateCrossSubject(supabase, null, blueprints, budgets, scoredPool);
    }
  }

  return {
    questions: resolved,
    resolutionCount: diagnostics.substitutions.length,
    diagnostics,
  };
}

// ─── Resolution Levels ────────────────────────────────────────────────────────

async function redistributeTopicShortfall(
  supabase: SupabaseClient,
  shortfall: number,
  slot: any,
  scoredPool: ScoredCandidatePool,
  budget: PointBudget
): Promise<ResolvedQuestion[]> {
  // Pull extra from same topic, adjacent difficulty levels
  const adjacentLevels = getAdjacentLevels(slot.level);
  const filled: ResolvedQuestion[] = [];

  for (const adjLevel of adjacentLevels) {
    if (filled.length >= shortfall) break;

    const adjSlot = scoredPool.slots.find(
      (s) =>
        s.slot.topicId === slot.topicId &&
        s.slot.subjectId === slot.subjectId &&
        s.slot.level === adjLevel
    );

    if (!adjSlot) continue;

    const needed = shortfall - filled.length;
    const extra = adjSlot.candidates.slice(0, needed);
    filled.push(...extra);
    debitPointBudget(budget, adjLevel * extra.length);
    creditPointBudget(budget, slot.level * extra.length);
  }

  return filled;
}

async function substituteAdjacentDifficulty(
  supabase: SupabaseClient,
  slot: any,
  scoredPool: ScoredCandidatePool,
  budget: PointBudget
): Promise<ResolvedQuestion[]> {
  const adjacentLevels = getAdjacentLevels(slot.level);
  const filled: ResolvedQuestion[] = [];

  for (const adjLevel of adjacentLevels) {
    if (filled.length >= slot.demand) break;

    const adjSlot = scoredPool.slots.find(
      (s) =>
        s.slot.topicId === slot.topicId &&
        s.slot.subjectId === slot.subjectId &&
        s.slot.level === adjLevel
    );

    if (!adjSlot || adjSlot.candidates.length === 0) continue;

    const needed = slot.demand - filled.length;
    const extra = adjSlot.candidates.slice(0, needed);
    filled.push(...extra);
    debitPointBudget(budget, adjLevel * extra.length);
    creditPointBudget(budget, slot.level * extra.length);
  }

  return filled;
}

async function replaceTopic(
  supabase: SupabaseClient,
  slot: any,
  scoredPool: ScoredCandidatePool,
  usedTopicIds: string[],
  budget: PointBudget
): Promise<ResolvedQuestion[]> {
  // Find another slot in the same subject not already used
  const replacement = scoredPool.slots.find(
    (s) =>
      s.slot.subjectId === slot.subjectId &&
      !usedTopicIds.includes(s.slot.topicId) &&
      s.candidates.length >= slot.demand
  );

  if (!replacement) return [];

  const picked = replacement.candidates.slice(0, slot.demand);
  debitPointBudget(budget, slot.level * slot.demand);
  return picked;
}

async function compensateCrossSubject(
  supabase: SupabaseClient,
  slot: any,
  blueprints: SubjectBlueprint[],
  budgets: Map<string, PointBudget>,
  scoredPool: ScoredCandidatePool
): Promise<ResolvedQuestion[]> {
  if (!slot) return [];

  // Find a surplus slot in a different subject
  const otherSubjectSlot = scoredPool.slots.find(
    (s) =>
      s.slot.subjectId !== slot.subjectId &&
      s.candidates.length > s.slot.demand
  );

  if (!otherSubjectSlot) return [];

  const surplus = otherSubjectSlot.candidates.slice(
    otherSubjectSlot.slot.demand,
    otherSubjectSlot.slot.demand + slot.demand
  );

  const otherBudget = budgets.get(otherSubjectSlot.slot.subjectId)!;
  debitPointBudget(otherBudget, otherSubjectSlot.slot.level * surplus.length);

  return surplus;
}

async function regenerateSubjectBlueprint(
  supabase: SupabaseClient,
  subjectId: string,
  blueprints: SubjectBlueprint[],
  scoredPool: ScoredCandidatePool,
  budget: PointBudget
): Promise<ResolvedQuestion[]> {
  // Find any available candidates in this subject across all slots
  const subjectSlots = scoredPool.slots.filter(
    (s) => s.slot.subjectId === subjectId && s.candidates.length > 0
  );

  if (subjectSlots.length === 0) return [];

  const filled: ResolvedQuestion[] = [];

  for (const s of subjectSlots) {
    filled.push(...s.candidates);
    if (filled.length >= 40) break;
  }

  return filled.slice(0, 40);
}

async function retryFullSession(
  supabase: SupabaseClient,
  userId: string,
  scoredPool: ScoredCandidatePool
): Promise<ResolvedQuestion[]> {
  // Last resort — pull whatever scored candidates exist across all slots
  const all: ResolvedQuestion[] = [];

  for (const { candidates } of scoredPool.slots) {
    all.push(...candidates);
  }

  return all.length >= 180 ? all.slice(0, 180) : [];
}

async function detectFailureCause(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string
): Promise<"bank_exhaustion" | "structural_gap"> {
  // Check if questions exist at all for this subject regardless of user history
  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", subjectId)
    .eq("status", "active");

  return (count ?? 0) < 40 ? "structural_gap" : "bank_exhaustion";
}

async function handleHardStop(
  supabase: SupabaseClient,
  userId: string,
  diagnostics: any
): Promise<void> {
  await notifyGenerationFailure(supabase, userId, diagnostics);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAdjacentLevels(level: number): number[] {
  const all = [1, 2, 3, 4, 5];
  return all
    .filter((l) => l !== level)
    .sort((a, b) => Math.abs(a - level) - Math.abs(b - level));
}
