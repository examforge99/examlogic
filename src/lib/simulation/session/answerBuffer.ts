// lib/simulation/session/answerBuffer.ts

import { SupabaseClient } from "@supabase/supabase-js";

export async function bufferAnswer(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  questionId: string,
  selectedOptionId: string,
  timeSpentSeconds: number
): Promise<{ success: boolean; error?: string }> {
  // Validate ownership
  const valid = await validateAnswerOwnership(supabase, sessionId, questionId, userId);
  if (!valid) return { success: false, error: "Invalid session or question" };

  await writeAnswerToSession(supabase, sessionId, questionId, selectedOptionId, timeSpentSeconds);

  return { success: true };
}

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

  // Confirm question belongs to this session
  const { data: qRow, error: qError } = await supabase
    .from("exam_session_questions")
    .select("id, selected_answer")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .single();

  if (qError || !qRow) return false;

  return true;
}

export async function writeAnswerToSession(
  supabase: SupabaseClient,
  sessionId: string,
  questionId: string,
  selectedOptionId: string,
  timeSpentSeconds: number
): Promise<void> {
  // Fetch current row state
  const { data: current, error } = await supabase
    .from("exam_session_questions")
    .select("selected_answer, answer_history, change_count, time_spent_seconds")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .single();

  if (error || !current) throw new Error("writeAnswerToSession: question row not found");

  // No change — same option re-selected, skip write
  if (current.selected_answer === selectedOptionId) return;

  const previousHistory: string[] = current.answer_history ?? [];
  const updatedHistory = [...previousHistory, selectedOptionId];
  const changeCount = (current.change_count ?? 0) + (current.selected_answer ? 1 : 0);
  const accumulatedTime = (current.time_spent_seconds ?? 0) + timeSpentSeconds;

  const { error: updateError } = await supabase
    .from("exam_session_questions")
    .update({
      selected_answer: selectedOptionId,
      answer_history: updatedHistory,
      change_count: changeCount,
      time_spent_seconds: accumulatedTime,
    })
    .eq("session_id", sessionId)
    .eq("question_id", questionId);

  if (updateError) throw new Error(`writeAnswerToSession failed: ${updateError.message}`);
}

export async function submitSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  bulkAnswers: Record<string, string> // questionId → selectedOptionId
): Promise<{ success: boolean; error?: string }> {
  // Validate session belongs to user and is active
  const { data: session, error } = await supabase
    .from("exam_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error || !session) return { success: false, error: "Session not found or already submitted" };

  // Fetch all question rows for reconciliation
  const { data: rows, error: rowsError } = await supabase
    .from("exam_session_questions")
    .select("question_id, selected_answer")
    .eq("session_id", sessionId);

  if (rowsError || !rows) return { success: false, error: "Failed to fetch session questions" };

  // Reconcile — bulk payload wins on discrepancy
  const discrepancies = rows.filter((row: any) => {
    const bulkAnswer = bulkAnswers[row.question_id];
    return bulkAnswer && bulkAnswer !== row.selected_answer;
  });

  // Write discrepancies
  for (const row of discrepancies) {
    const bulkAnswer = bulkAnswers[row.question_id];
    await supabase
      .from("exam_session_questions")
      .update({
        selected_answer: bulkAnswer,
        answer_history: supabase.rpc("append_to_history", {
          session_id: sessionId,
          question_id: row.question_id,
          new_answer: bulkAnswer,
        }),
      })
      .eq("session_id", sessionId)
      .eq("question_id", row.question_id);
  }

  // Mark session submitted
  const { error: submitError } = await supabase
    .from("exam_sessions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      auto_submitted: false,
    })
    .eq("id", sessionId);

  if (submitError) return { success: false, error: "Failed to submit session" };

  return { success: true };
}

export async function autoSubmitSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  await supabase
    .from("exam_sessions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      auto_submitted: true,
    })
    .eq("id", sessionId);
}
