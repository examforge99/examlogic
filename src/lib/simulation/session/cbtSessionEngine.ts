// lib/simulation/session/cbtSessionEngine.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { ResolvedCandidatePool, ResolvedQuestion } from "@/lib/simulation/pipelines/constraintResolution";
import { ValidationReport } from "@/lib/simulation/pipelines/sessionValidation";

export async function createCBTSession(
  supabase: SupabaseClient,
  userId: string,
  resolvedPool: ResolvedCandidatePool,
  validationReport: ValidationReport,
  difficultyTemplateIds: number[],
  topicTemplateIds: number[]
) {
  // ── One active session rule ──────────────────────────────────────────────
  const activeSession = await getActiveSession(supabase, userId);
  if (activeSession) return null;

  // ── Create session record ────────────────────────────────────────────────
  const session = await createSessionRecord(supabase, userId, {
    difficultyTemplateIds,
    topicTemplateIds,
    resolutionCount: validationReport.resolutionCount,
  });

  if (!session) return null;

  // ── Assign positions and store questions ─────────────────────────────────
  const positioned = assignQuestionPositions(resolvedPool.questions);
  await storeSessionQuestions(supabase, session.id, positioned);

  return buildSessionResponse(session, positioned);
}

export async function createSessionRecord(
  supabase: SupabaseClient,
  userId: string,
  metadata: {
    difficultyTemplateIds: number[];
    topicTemplateIds: number[];
    resolutionCount: number;
  }
) {
  const { data, error } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: userId,
      mode: "simulation",
      status: "pending",
      started_at: null,
      expires_at: null,
      total_questions: 180,
      correct_count: 0,
      total_time_seconds: 0,
      difficulty_template_ids: metadata.difficultyTemplateIds,
      topic_template_ids: metadata.topicTemplateIds,
      resolution_count: metadata.resolutionCount,
      is_flagged: false,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[cbtSessionEngine] createSessionRecord failed:", error);
    return null;
  }

  return data;
}

export async function storeSessionQuestions(
  supabase: SupabaseClient,
  sessionId: string,
  questions: (ResolvedQuestion & { position: number })[]
) {
  const rows = questions.map((q) => ({
    session_id: sessionId,
    question_id: q.id,
    subject_id: q.subject_id,
    topic_id: q.topic_id,
    difficulty_level: q.difficulty_level,
    position: q.position,
    selected_answer: null,
    time_spent_seconds: null,
    is_correct: null,
  }));

  const { error } = await supabase.from("exam_session_questions").insert(rows);

  if (error) throw new Error(`storeSessionQuestions failed: ${error.message}`);
}

export function assignQuestionPositions(
  questions: ResolvedQuestion[]
): (ResolvedQuestion & { position: number })[] {
  // English: positions 1–60
  // Subject 2: positions 61–100
  // Subject 3: positions 101–140
  // Subject 4: positions 141–180

  const english = questions.filter((q) => q.subject_id === getEnglishId(questions));
  const others = questions.filter((q) => q.subject_id !== getEnglishId(questions));

  // Group others by subject
  const subjectMap = new Map<string, ResolvedQuestion[]>();
  for (const q of others) {
    if (!subjectMap.has(q.subject_id)) subjectMap.set(q.subject_id, []);
    subjectMap.get(q.subject_id)!.push(q);
  }

  const positioned: (ResolvedQuestion & { position: number })[] = [];
  let pos = 1;

  // English block
  for (const q of english) {
    positioned.push({ ...q, position: pos++ });
  }

  // Other subject blocks
  for (const [, subjectQuestions] of subjectMap.entries()) {
    for (const q of subjectQuestions) {
      positioned.push({ ...q, position: pos++ });
    }
  }

  return positioned;
}

export function buildSessionResponse(
  session: any,
  questions: (ResolvedQuestion & { position: number })[]
) {
  // Strip correct_option_id — never expose to frontend
  const safeQuestions = questions.map(({ correct_option_id, score, resolutionLevel, ...q }) => q);

  return {
    session_id: session.id,
    mode: "simulation",
    status: session.status,
    total_questions: 180,
    time_limit_seconds: 5400, // 90 minutes
    questions: safeQuestions,
  };
}

export async function getActiveSession(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("exam_sessions")
    .select("id, status, expires_at")
    .eq("user_id", userId)
    .in("status", ["pending", "active"])
    .single();

  if (error || !data) return null;

  return data;
}

export async function getSessionById(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
) {
  const { data: session, error } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error || !session) return null;

  const { data: questions } = await supabase
    .from("exam_session_questions")
    .select("question_id, subject_id, topic_id, difficulty_level, position, selected_answer, time_spent_seconds")
    .eq("session_id", sessionId)
    .order("position", { ascending: true });

  return { session, questions: questions ?? [] };
}

export async function startSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 60 * 1000); // 90 minutes

  const { data, error } = await supabase
    .from("exam_sessions")
    .update({
      status: "active",
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .select()
    .single();

  if (error || !data) return null;

  return data;
}

export async function getSessionResult(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
) {
  const { data: session, error } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "scored")
    .single();

  if (error || !session) return null;

  const { data: questions } = await supabase
    .from("exam_session_questions")
    .select("question_id, subject_id, topic_id, difficulty_level, position, selected_answer, is_correct, time_spent_seconds")
    .eq("session_id", sessionId)
    .order("position", { ascending: true });

  return { session, questions: questions ?? [] };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getEnglishId(questions: ResolvedQuestion[]): string {
  // English block is always the largest subject group (60 questions)
  const counts = new Map<string, number>();
  for (const q of questions) {
    counts.set(q.subject_id, (counts.get(q.subject_id) ?? 0) + 1);
  }
  let maxId = "";
  let maxCount = 0;
  for (const [id, count] of counts.entries()) {
    if (count > maxCount) { maxCount = count; maxId = id; }
  }
  return maxId;
}
