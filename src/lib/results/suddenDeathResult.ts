// lib/results/suddenDeathResult.ts

import { SupabaseClient } from "@supabase/supabase-js";

interface SdSessionState {
  session_id: string;
  user_id: string;
  baseline_difficulty_band: number;
  current_difficulty_band: number;
  current_streak: number;
}

export interface SuddenDeathResult {
  baseline_difficulty_band: number;
  peak_difficulty_band: number;
  levels_climbed: number;
  final_streak: number;
  total_questions_answered: number;
  total_correct: number;
  ended_by_timeout: boolean;
  growth_message: string;
}

function computeGrowthMessage(levelsClimbed: number): string {
  if (levelsClimbed <= 0) {
    return "Keep pushing — your breakthrough is coming.";
  }
  if (levelsClimbed === 1) {
    return "You're right at your edge. Almost had it.";
  }
  if (levelsClimbed === 2) {
    return "Strong run — you're growing.";
  }
  return "Exceptional — you're ahead of where you started.";
}

export async function endSuddenDeathSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  sdSession: SdSessionState,
  timedOut: boolean
): Promise<SuddenDeathResult> {
  const levelsClimbed = sdSession.current_difficulty_band - sdSession.baseline_difficulty_band;

  const { data: attempted } = await supabase
    .from("exam_session_questions")
    .select("is_correct")
    .eq("session_id", sessionId);

  const totalAttempted = attempted?.length ?? 0;
  const totalCorrect = attempted?.filter((q: any) => q.is_correct).length ?? 0;

  await supabase
    .from("exam_sessions")
    .update({
      status: "scored",
      is_completed: true,
      completed_at: new Date().toISOString(),
      total_questions: totalAttempted,
      correct_count: totalCorrect,
    })
    .eq("id", sessionId);

  await supabase.from("sudden_death_records").insert({
    session_id: sessionId,
    user_id: userId,
    baseline_difficulty_band: sdSession.baseline_difficulty_band,
    peak_difficulty_band: sdSession.current_difficulty_band,
    levels_climbed: levelsClimbed,
    final_streak: sdSession.current_streak,
    total_questions_answered: totalAttempted,
    ended_by_timeout: timedOut,
  });

  await supabase.from("sd_active_sessions").delete().eq("session_id", sessionId);

  return {
    baseline_difficulty_band: sdSession.baseline_difficulty_band,
    peak_difficulty_band: sdSession.current_difficulty_band,
    levels_climbed: levelsClimbed,
    final_streak: sdSession.current_streak,
    total_questions_answered: totalAttempted,
    total_correct: totalCorrect,
    ended_by_timeout: timedOut,
    growth_message: computeGrowthMessage(levelsClimbed),
  };
}
