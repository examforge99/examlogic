// lib/simulation/session/answerBuffer.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { scoreSession } from "@/lib/simulation/scoring/scoringEngine";

const MAX_TIME_PER_QUESTION = 7200;
const ABSENCE_THRESHOLD = 4;

// ─── Buffer Answer ────────────────────────────────────────────────────────────

export async function bufferAnswer(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  questionId: string,
  selectedOptionId: string,
  timeSpentSeconds: number
): Promise<{ success: boolean; error?: string }> {
  if (timeSpentSeconds < 0 || timeSpentSeconds > MAX_TIME_PER_QUESTION) {
    return { success: false, error: "Invalid time_spent_seconds" };
  }

  const valid = await validateAnswerOwnership(supabase, sessionId, questionId, userId);
  if (!valid) return { success: false, error: "Invalid session or question" };

  await writeAnswerToSession(supabase, sessionId, questionId, selectedOptionId, timeSpentSeconds);

  return { success: true };
}

// ─── Validate Answer Ownership ────────────────────────────────────────────────

export async function validateAnswerOwnership(
  supabase: SupabaseClient,
  sessionId: string,
  questionId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("exam_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !data) return false;

  const { data: qRow, error: qError } = await supabase
    .from("exam_session_questions")
    .select("id")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .single();

  if (qError || !qRow) return false;

  return true;
}

// ─── Write Answer To Session ──────────────────────────────────────────────────

export async function writeAnswerToSession(
  supabase: SupabaseClient,
  sessionId: string,
  questionId: string,
  selectedOptionId: string,
  timeSpentSeconds: number
): Promise<void> {
  const { data: current, error } = await supabase
    .from("exam_session_questions")
    .select("selected_answer, answer_history, change_count")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .single();

  if (error || !current) throw new Error("writeAnswerToSession: question row not found");

  // Same option re-selected — only update time
  if (current.selected_answer === selectedOptionId) {
    await supabase
      .from("exam_session_questions")
      .update({ time_spent_seconds: timeSpentSeconds })
      .eq("session_id", sessionId)
      .eq("question_id", questionId);
    return;
  }

  const previousHistory: string[] = current.answer_history ?? [];
  const updatedHistory = [...previousHistory, selectedOptionId];
  const changeCount = (current.change_count ?? 0) + (current.selected_answer ? 1 : 0);

  const { error: updateError } = await supabase
    .from("exam_session_questions")
    .update({
      selected_answer: selectedOptionId,
      answer_history: updatedHistory,
      change_count: changeCount,
      time_spent_seconds: timeSpentSeconds,
    })
    .eq("session_id", sessionId)
    .eq("question_id", questionId);

  if (updateError) throw new Error(`writeAnswerToSession failed: ${updateError.message}`);
}

// ─── Fire Difficulty Update ───────────────────────────────────────────────────
// Non-blocking — runs after scoring completes
// Correct answers must be written to exam_session_questions before this runs

async function fireDifficultyUpdate(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const { error } = await supabase.rpc("update_question_difficulty", {
    p_session_id: sessionId,
  });
  if (error) {
    console.error("[difficulty] update_question_difficulty failed:", error.message);
  }
}

// ─── Submit Session ───────────────────────────────────────────────────────────

export async function submitSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  bulkAnswers: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const { data: session, error } = await supabase
    .from("exam_sessions")
    .select("id, status, total_absence_events")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !session) {
    return { success: false, error: "Session not found or already submitted" };
  }

  // Fetch all question rows for reconciliation
  const { data: rows, error: rowsError } = await supabase
    .from("exam_session_questions")
    .select("question_id, selected_answer, answer_history")
    .eq("session_id", sessionId);

  if (rowsError || !rows) {
    return { success: false, error: "Failed to fetch session questions" };
  }

  // Reconcile — bulk payload wins on discrepancy
  const discrepancies = rows.filter((row: any) => {
    const bulkAnswer = bulkAnswers[row.question_id];
    return bulkAnswer && bulkAnswer !== row.selected_answer;
  });

  for (const row of discrepancies) {
    const bulkAnswer = bulkAnswers[row.question_id];
    const updatedHistory = [...(row.answer_history ?? []), bulkAnswer];

    await supabase
      .from("exam_session_questions")
      .update({
        selected_answer: bulkAnswer,
        answer_history: updatedHistory,
      })
      .eq("session_id", sessionId)
      .eq("question_id", row.question_id);
  }

  // Flag if suspicious
  const absenceEvents = session.total_absence_events ?? 0;
  const isFlagged = absenceEvents >= ABSENCE_THRESHOLD;

  const { error: submitError } = await supabase
    .from("exam_sessions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      auto_submitted: false,
      is_flagged: isFlagged,
      flag_reason: isFlagged ? "frequent_absences" : null,
    })
    .eq("id", sessionId);

  if (submitError) return { success: false, error: "Failed to submit session" };

  // Notify admin if flagged
  if (isFlagged) {
    await supabase.from("admin_notifications").insert({
      type: "suspicious_session",
      session_id: sessionId,
      user_id: userId,
      payload: {
        total_absence_events: absenceEvents,
        flag_reason: "frequent_absences",
      },
      resolved: false,
    });
  }

  // Fire scoring then difficulty update — both non-blocking
  // User navigates to result page immediately
  // Result page polls until status = "scored"
  scoreSession(supabase, sessionId, userId).then(({ success, error }) => {
  if (!success) {
    console.error("[autoSubmitSession] scoring failed:", error);
  }
});

  return { success: true };
}

// ─── Auto Submit Session ──────────────────────────────────────────────────────

export async function autoSubmitSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<void> {
  await supabase
    .from("exam_sessions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      auto_submitted: true,
    })
    .eq("id", sessionId);

  // Fire scoring then difficulty update — both non-blocking
  scoreSession(supabase, sessionId, userId).then(({ success, error }) => {
  if (!success) {
    console.error("[autoSubmitSession] scoring failed:", error);
  }
});
    }
