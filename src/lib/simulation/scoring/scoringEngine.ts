// lib/simulation/scoring/scoringEngine.ts

import { SupabaseClient } from "@supabase/supabase-js";

interface SessionQuestion {
  question_id: string;
  session_id: string;
  subject_id: string;
  topic_id: string;
  difficulty_level: number;
  position: number;
  selected_answer: string | null;
  correct_option_id: string;
  time_spent_seconds: number;
  change_count: number;
  answer_history: string[];
  is_correct: boolean | null;
}

interface SubjectSummary {
  subject_id: string;
  total: number;
  correct: number;
  accuracy: number;
  total_time_seconds: number;
}

interface ScoringResult {
  correct_count: number;
  total_questions: number;
  accuracy: number;
  total_time_seconds: number;
  subject_summaries: SubjectSummary[];
  total_points: number;
}

export async function scoreSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // ── 1. Fetch session ───────────────────────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "submitted")
    .single();

  if (sessionError || !session) {
    return { success: false, error: "Session not found or not submitted" };
  }

  // ── 2. Fetch all session questions ────────────────────────────────────
  const { data: questions, error: questionsError } = await supabase
    .from("exam_session_questions")
    .select("*")
    .eq("session_id", sessionId);

  if (questionsError || !questions) {
    return { success: false, error: "Failed to fetch session questions" };
  }

  // ── 3. Score each question ────────────────────────────────────────────
  const scoredQuestions = questions.map((q: SessionQuestion) => ({
    ...q,
    is_correct: q.selected_answer !== null && q.selected_answer === q.correct_option_id,
  }));

  // ── 4. Compute summary ────────────────────────────────────────────────
  const result = computeSummary(scoredQuestions);

  // ── 5. Write to attempts ──────────────────────────────────────────────
  const attemptRows = scoredQuestions.map((q) => ({
    session_id: sessionId,
    user_id: userId,
    question_id: q.question_id,
    subject_id: q.subject_id,
    topic_id: q.topic_id,
    difficulty_level: q.difficulty_level,
    selected_option_id: q.selected_answer ?? null,
    correct_option_id: q.correct_option_id,
    is_correct: q.is_correct,
    time_taken_seconds: q.time_spent_seconds,
    change_count: q.change_count,
    answer_history: q.answer_history,
    question_order: q.position,
    attempted_at: new Date().toISOString(),
  }));

  const { error: attemptsError } = await supabase
    .from("attempts")
    .insert(attemptRows);

  if (attemptsError) {
    console.error("[scoringEngine] attempts insert failed:", attemptsError);
    return { success: false, error: "Failed to write attempts" };
  }

  // ── 6. Update exam_sessions with final scores ─────────────────────────
  const { error: updateError } = await supabase
    .from("exam_sessions")
    .update({
      status: "scored",
      is_completed: true,
      completed_at: new Date().toISOString(),
      correct_count: result.correct_count,
      total_time_seconds: result.total_time_seconds,
      overall_accuracy_percent: result.accuracy,
      overall_avg_time_per_question: result.total_time_seconds / result.total_questions,
      total_points: result.total_points,
    })
    .eq("id", sessionId);

  if (updateError) {
    console.error("[scoringEngine] session update failed:", updateError);
    return { success: false, error: "Failed to update session" };
  }

  // ── 7. Write per-subject summaries ────────────────────────────────────
  const summaryRows = result.subject_summaries.map((s) => ({
    session_id: sessionId,
    user_id: userId,
    subject_id: s.subject_id,
    total_questions: s.total,
    correct_count: s.correct,
    accuracy_percent: s.accuracy,
    total_time_seconds: s.total_time_seconds,
  }));

  await supabase.from("session_subject_summaries").insert(summaryRows);

  // ── 8. Update user total points and stats ─────────────────────────────
  const { data: user } = await supabase
    .from("users")
    .select("total_points, total_sessions_completed")
    .eq("id", userId)
    .single();

  if (user) {
    await supabase
      .from("users")
      .update({
        total_points: (user.total_points ?? 0) + result.total_points,
        total_sessions_completed: (user.total_sessions_completed ?? 0) + 1,
        last_active_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", userId);
  }

  // ── 9. Clear exam_session_questions ───────────────────────────────────
  await supabase
    .from("exam_session_questions")
    .delete()
    .eq("session_id", sessionId);

  return { success: true };
}

// ─── Compute summary ──────────────────────────────────────────────────────────

function computeSummary(questions: (SessionQuestion & { is_correct: boolean })[]) : ScoringResult {
  const correct_count = questions.filter((q) => q.is_correct).length;
  const total_questions = questions.length;
  const accuracy = total_questions > 0
    ? Math.round((correct_count / total_questions) * 100)
    : 0;
  const total_time_seconds = questions.reduce(
    (sum, q) => sum + (q.time_spent_seconds ?? 0),
    0
  );

  // Per-subject summaries
  const subjectMap = new Map<string, { total: number; correct: number; time: number }>();
  for (const q of questions) {
    const existing = subjectMap.get(q.subject_id) ?? { total: 0, correct: 0, time: 0 };
    subjectMap.set(q.subject_id, {
      total: existing.total + 1,
      correct: existing.correct + (q.is_correct ? 1 : 0),
      time: existing.time + (q.time_spent_seconds ?? 0),
    });
  }

  const subject_summaries: SubjectSummary[] = [];
  for (const [subject_id, data] of subjectMap.entries()) {
    subject_summaries.push({
      subject_id,
      total: data.total,
      correct: data.correct,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      total_time_seconds: data.time,
    });
  }

  // Points — 2 points per correct answer
  const total_points = correct_count * 2;

  return {
    correct_count,
    total_questions,
    accuracy,
    total_time_seconds,
    subject_summaries,
    total_points,
  };
}
