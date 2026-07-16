// lib/simulation/pipelines/questionRetrieval.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { SubjectBlueprint, TopicDemand } from "@/lib/simulation/engines/topicDifficultyAllocator";

export interface QuestionOption {
  id: string;
  option_text: string;
  position: number;
}

export interface CandidateQuestion {
  id: string;
  subject_id: string;
  topic_id: string;
  difficulty_level: number;
  resolved_question_type: string;
  question_text: string;
  correct_option_id: string;
  question_options: QuestionOption[];
}

export interface FetchSlot {
  subjectId: string;
  topicId: string;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  demand: number;
  fetchCount: number;
}

export interface RawCandidatePool {
  slots: {
    slot: FetchSlot;
    candidates: CandidateQuestion[];
  }[];
}

export async function retrieveCandidates(
  supabase: SupabaseClient,
  blueprints: SubjectBlueprint[]
): Promise<RawCandidatePool> {
  const manifest = buildFetchManifest(blueprints);
  const slots = [];

  for (const slot of manifest) {
    const candidates = await fetchCandidatesForSlot(
      supabase,
      slot.subjectId,
      slot.topicId,
      slot.level,
      slot.fetchCount
    );

    slots.push({ slot, candidates });
  }

  return { slots };
}

export function buildFetchManifest(blueprints: SubjectBlueprint[]): FetchSlot[] {
  const manifest: FetchSlot[] = [];

  for (const blueprint of blueprints) {
    for (const topic of blueprint.topics) {
      const levels = [1, 2, 3, 4, 5, 6, 7] as const;

      for (const level of levels) {
        const demand = topic[`level${level}` as keyof TopicDemand] as number;
        if (!demand || demand === 0) continue;

        manifest.push({
          subjectId: blueprint.subjectId,
          topicId: topic.topicId,
          level,
          demand,
          fetchCount: applyCandidateMultiplier(demand),
        });
      }
    }
  }

  return manifest;
}

export async function fetchCandidatesForSlot(
  supabase: SupabaseClient,
  subjectId: string,
  topicId: string,
  level: number,
  fetchCount: number
): Promise<CandidateQuestion[]> {
  const { data, error } = await supabase
    .from("questions")
    .select(`
      id,
      subject_id,
      topic_id,
      difficulty_level,
      resolved_question_type,
      question_text,
      correct_option_id,
      question_options (
        id,
        option_text,
        position
      )
    `)
    .eq("subject_id", subjectId)
    .eq("topic_id", topicId)
    .eq("difficulty_level", level)
    .eq("status", "active")
    .limit(fetchCount);

  if (error) {
    console.error(
      `[questionRetrieval] fetchCandidatesForSlot failed — subject:${subjectId} topic:${topicId} level:${level}`,
      error
    );
    return [];
  }

  // Sort options by position for each question
  return (data ?? []).map((q) => ({
    ...q,
    question_options: (q.question_options ?? []).sort(
      (a: QuestionOption, b: QuestionOption) => a.position - b.position
    ),
  }));
}

export function applyCandidateMultiplier(demand: number): number {
  return demand * 3;
}
