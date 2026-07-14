// lib/simulation/scoring/scoringEngine.ts

import { SupabaseClient } from "@supabase/supabase-js";
import {
  computeSessionPoints,
  computeNewRankTier,
  RANK_THRESHOLDS,
  QuestionScore,
} from "@/lib/simulation/scoring/pointsEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  is_correct?: boolean;
}

interface SubjectSummary {
  subject_id: string;
  total: number;
  correct: number;
  accuracy: number;
  total_time_seconds: number;
  max_streak: number;
  simulation_score: number; // out of 100
}

interface ScoringResult {
  correct_count: number;
  total_questions: number;
  accuracy: number;
  total_time_seconds: number;
  subject_summaries: SubjectSummary[];
  simulation_score: number; // out of 400
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

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

  // ── 2. Fetch all session questions ─────────────────────────────────────
  const { data: questions, error: questionsError } = await supabase
    .from("exam_session_questions")
    .select("*")
    .eq("session_id", sessionId);

  if (questionsError || !questions || questions.length === 0) {
    return { success: false, error: "Failed to fetch session questions" };
  }

  // ── 3. Score each question ─────────────────────────────────────────────
  const scoredQuestions = (questions as SessionQuestion[]).map((q) => ({
    ...q,
    is_correct:
      q.selected_answer !== null &&
      q.selected_answer === q.correct_option_id,
  }));

  // ── 4. Compute scoring summary ─────────────────────────────────────────
  const result = computeSummary(
    scoredQuestions as (SessionQuestion & { is_correct: boolean })[]
  );

  // ── 5. Write to attempts ───────────────────────────────────────────────
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

  // ── 6. Compute leaderboard points ─────────────────────────────────────
  const { data: user } = await supabase
    .from("users")
    .select("total_points, total_sessions_completed, current_rank_tier, consecutive_poor_sessions")
    .eq("id", userId)
    .single();

  const currentRankTier = user?.current_rank_tier ?? "unranked";

  const questionScores: QuestionScore[] = scoredQuestions.map((q) => ({
    question_id: q.question_id,
    subject_id: q.subject_id,
    topic_id: q.topic_id,
    difficulty_level: q.difficulty_level,
    is_correct: q.is_correct,
    time_spent_seconds: q.time_spent_seconds,
  }));

  const pointsBreakdown = computeSessionPoints(
    questionScores,
    currentRankTier,
    session.auto_submitted ?? false
  );

  const consecutivePoorSessions = pointsBreakdown.is_poor_performance
    ? (user?.consecutive_poor_sessions ?? 0) + 1
    : 0;

  const newTotalPoints = Math.max(
    0,
    (user?.total_points ?? 0) + pointsBreakdown.total_points
  );

  const newRankTier = computeNewRankTier(
    newTotalPoints,
    currentRankTier,
    consecutivePoorSessions
  );

  const rankChanged = newRankTier !== currentRankTier;
  const demoted =
    rankChanged &&
    RANK_THRESHOLDS[newRankTier] < RANK_THRESHOLDS[currentRankTier];

  // ── 7. Update exam_sessions ────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from("exam_sessions")
    .update({
      status: "scored",
      is_completed: true,
      completed_at: new Date().toISOString(),
      correct_count: result.correct_count,
      total_time_seconds: result.total_time_seconds,
      overall_accuracy_percent: result.accuracy,
      overall_avg_time_per_question:
        result.total_questions > 0
          ? result.total_time_seconds / result.total_questions
          : 0,
      simulation_score: result.simulation_score,
      base_points: pointsBreakdown.base_points,
      bonus_points:
        pointsBreakdown.speed_bonus +
        pointsBreakdown.accuracy_bonus +
        pointsBreakdown.streak_bonus +
        pointsBreakdown.completion_bonus,
      total_points: pointsBreakdown.total_points,
    })
    .eq("id", sessionId);

  if (updateError) {
    console.error("[scoringEngine] session update failed:", updateError);
    return { success: false, error: "Failed to update session" };
  }

  // ── 8. Write per-subject summaries ────────────────────────────────────
  const summaryRows = result.subject_summaries.map((s) => ({
    session_id: sessionId,
    user_id: userId,
    subject_id: s.subject_id,
    questions_answered: s.total,
    correct_count: s.correct,
    accuracy_percent: s.accuracy,
    total_time_seconds: s.total_time_seconds,
    avg_time_per_question:
      s.total > 0 ? Math.round(s.total_time_seconds / s.total) : 0,
    max_streak_in_subject: s.max_streak,
    simulation_score: s.simulation_score,
    gems_contribution: 0,
  }));

  const { error: summaryError } = await supabase
    .from("session_subject_summaries")
    .insert(summaryRows);

  if (summaryError) {
    console.error("[scoringEngine] summary insert failed:", summaryError);
  }

  // ── 9. Update user ─────────────────────────────────────────────────────
  await supabase
    .from("users")
    .update({
      total_points: newTotalPoints,
      current_rank_tier: newRankTier,
      total_sessions_completed: (user?.total_sessions_completed ?? 0) + 1,
      last_active_date: new Date().toISOString().split("T")[0],
      consecutive_poor_sessions: consecutivePoorSessions,
    })
    .eq("id", userId);

  // ── 10. Log rank change ────────────────────────────────────────────────
  if (rankChanged) {
    await supabase.from("rank_scores").insert({
      user_id: userId,
      previous_tier: currentRankTier,
      new_tier: newRankTier,
      total_points_at_change: newTotalPoints,
      session_id: sessionId,
      demoted,
    });
  }

  // ── 11. Clear exam_session_questions ──────────────────────────────────
  await supabase
    .from("exam_session_questions")
    .delete()
    .eq("session_id", sessionId);

  return { success: true };
}

// ─── Compute Summary ──────────────────────────────────────────────────────────

function computeSummary(
  questions: (SessionQuestion & { is_correct: boolean })[]
): ScoringResult {
  const correct_count = questions.filter((q) => q.is_correct).length;
  const total_questions = questions.length;
  const accuracy =
    total_questions > 0
      ? Math.round((correct_count / total_questions) * 100)
      : 0;
  const total_time_seconds = questions.reduce(
    (sum, q) => sum + (q.time_spent_seconds ?? 0),
    0
  );

  // Group by subject with streak tracking
  const subjectMap = new Map<
    string,
    {
      total: number;
      correct: number;
      time: number;
      currentStreak: number;
      maxStreak: number;
    }
  >();

  for (const q of questions) {
    const existing = subjectMap.get(q.subject_id) ?? {
      total: 0,
      correct: 0,
      time: 0,
      currentStreak: 0,
      maxStreak: 0,
    };

    const currentStreak = q.is_correct ? existing.currentStreak + 1 : 0;
    const maxStreak = Math.max(existing.maxStreak, currentStreak);

    subjectMap.set(q.subject_id, {
      total: existing.total + 1,
      correct: existing.correct + (q.is_correct ? 1 : 0),
      time: existing.time + (q.time_spent_seconds ?? 0),
      currentStreak,
      maxStreak,
    });
  }

  // Build subject summaries with simulation score
  // Each subject is worth 100 marks regardless of question count
  // English: 60q → 100/60 = 1.667 per correct
  // Others:  40q → 100/40 = 2.5 per correct
  const subject_summaries: SubjectSummary[] = [];

  for (const [subject_id, data] of subjectMap.entries()) {
    const markPerQuestion = 100 / data.total;
    const simulation_score =
      Math.round(data.correct * markPerQuestion * 10) / 10;

    subject_summaries.push({
      subject_id,
      total: data.total,
      correct: data.correct,
      accuracy:
        data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      total_time_seconds: data.time,
      max_streak: data.maxStreak,
      simulation_score,
    });
  }

  // Total simulation score out of 400
  const simulation_score =
    Math.round(
      subject_summaries.reduce((sum, s) => sum + s.simulation_score, 0) * 10
    ) / 10;

  return {
    correct_count,
    total_questions,
    accuracy,
    total_time_seconds,
    subject_summaries,
    simulation_score,
  };
}
