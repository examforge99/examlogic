// lib/simulation/pipelines/candidateScoring.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { CandidateQuestion, RawCandidatePool } from "@/lib/simulation/pipelines/questionRetrieval";

export interface ScoredCandidate extends CandidateQuestion {
  score: number;
}

export interface ScoredCandidatePool {
  slots: {
    slot: RawCandidatePool["slots"][number]["slot"];
    candidates: ScoredCandidate[];
  }[];
}

interface HistoryEntry {
  question_id: string;
  was_correct: boolean;
  answered_at: string;
}

export async function scoreCandidates(
  supabase: SupabaseClient,
  rawPool: RawCandidatePool,
  userId: string
): Promise<ScoredCandidatePool> {
  const historyMap = await fetchUserQuestionHistory(supabase, userId);

  const slots = rawPool.slots.map(({ slot, candidates }) => ({
    slot,
    candidates: sortCandidatesByScore(
      candidates.map((q) => scoreCandidate(q, historyMap))
    ),
  }));

  return { slots };
}

export async function fetchUserQuestionHistory(
  supabase: SupabaseClient,
  userId: string
): Promise<Map<string, HistoryEntry>> {
  const { data, error } = await supabase
    .from("user_question_history")
    .select("question_id, was_correct, answered_at")
    .eq("user_id", userId);

  if (error || !data) return new Map();

  const map = new Map<string, HistoryEntry>();
  for (const row of data) {
    map.set(row.question_id, row);
  }

  return map;
}

export function scoreCandidate(
  question: CandidateQuestion,
  historyMap: Map<string, HistoryEntry>
): ScoredCandidate {
  const entry = historyMap.get(question.id);

  if (!entry) {
    return { ...question, score: 100 }; // never seen
  }

  if (!entry.was_correct) {
    return { ...question, score: 60 }; // seen + wrong
  }

  const answeredAt = new Date(entry.answered_at).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  if (answeredAt < sevenDaysAgo) {
    return { ...question, score: 40 }; // seen + correct + long ago
  }

  return { ...question, score: 20 }; // seen + correct + recent
}

export function sortCandidatesByScore(candidates: ScoredCandidate[]): ScoredCandidate[] {
  return candidates.slice().sort((a, b) => b.score - a.score);
}
