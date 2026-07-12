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
      is_completed: false,
      total_questions: 180,
      correct_count: 0,
      total_time_seconds: 0,
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      gems_earned: 0,
      is_flagged: false,
      missed_heartbeats: 0,
      total_absence_events: 0,
      auto_submitted: false,
      resolution_count: metadata.resolutionCount,
      difficulty_template_ids: metadata.difficultyTemplateIds,
      topic_template_ids: metadata.topicTemplateIds,
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
    correct_option_id: q.correct_option_id,
    selected_answer: null,
    time_spent_seconds: 0,
    answer_history: [],
    change_count: 0,
    is_correct: null,
  }));

  const { error } = await supabase
    .from("exam_session_questions")
    .insert(rows);

  if (error) throw new Error(`storeSessionQuestions failed: ${error.message}`);
}

export function assignQuestionPositions(
  questions: ResolvedQuestion[]
): (ResolvedQuestion & { position: number })[] {
  const englishId = getEnglishSubjectId(questions);

  const english = questions.filter((q) => q.subject_id === englishId);
  const others = questions.filter((q) => q.subject_id !== englishId);

  const subjectMap = new Map<string, ResolvedQuestion[]>();
  for (const q of others) {
    if (!subjectMap.has(q.subject_id)) subjectMap.set(q.subject_id, []);
    subjectMap.get(q.subject_id)!.push(q);
  }

  const positioned: (ResolvedQuestion & { position: number })[] = [];
  let pos = 1;

  for (const q of english) {
    positioned.push({ ...q, position: pos++ });
  }

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
  const safeQuestions = questions.map(({
    correct_option_id,
    score,
    resolutionLevel,
    ...q
  }) => q);

  return {
    session_id: session.id,
    mode: "simulation",
    status: session.status,
    total_questions: 180,
    time_limit_seconds: 7200, // 120 minutes
    started_at: session.started_at,
    expires_at: session.expires_at,
    questions: safeQuestions,
  };
}

export async function getActiveSession(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("exam_sessions")
    .select("id, status, expires_at, started_at")
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
    .select(`
      question_id,
      subject_id,
      topic_id,
      difficulty_level,
      position,
      selected_answer,
      time_spent_seconds,
      answer_history,
      change_count,
      questions (
        id,
        question_text
      ),
      question_options (
        id,
        option_text,
        position
      )
    `)
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
  const expiresAt = new Date(now.getTime() + 120 * 60 * 1000); // 120 minutes

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

  const { data: attempts } = await supabase
    .from("attempts")
    .select(`
      question_id,
      subject_id,
      topic_id,
      difficulty_level,
      selected_option_id,
      correct_option_id,
      is_correct,
      time_taken_seconds,
      change_count,
      answer_history
    `)
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("attempted_at", { ascending: true });

  return { session, attempts: attempts ?? [] };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function getEnglishSubjectId(questions: ResolvedQuestion[]): string {
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
