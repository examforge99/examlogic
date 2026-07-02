import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

interface SessionRow {
  id: string;
  user_id: string;
  mode: string;
  variant: string;
  started_at: string;
  completed_at: string | null;
  is_completed: boolean;
  total_questions: number;
  correct_count: number;
  max_streak: number;
  total_time_seconds: number;
  overall_accuracy_percent: number;
  overall_avg_time_per_question: number;
  base_points: number;
  total_points: number;
  gems_earned: number;
  starting_difficulty_band: string;
  mode_multiplier: number;
  variant_multiplier: number;
  strikes_remaining: number | null;
  is_flagged: boolean;
}

interface AttemptRow {
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  time_taken_seconds: number;
  streak_at_time: number;
  difficulty_band_at_time: string;
  question_order: number;
  points_earned: number;
}

interface SubjectSummaryRow {
  subject_id: string;
  questions_answered: number;
  correct_count: number;
  accuracy_percent: number;
  total_time_seconds: number;
  avg_time_per_question: number;
  max_streak_in_subject: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select(
      "id, user_id, mode, variant, started_at, completed_at, is_completed, total_questions, correct_count, max_streak, total_time_seconds, overall_accuracy_percent, overall_avg_time_per_question, base_points, total_points, gems_earned, starting_difficulty_band, mode_multiplier, variant_multiplier, strikes_remaining, is_flagged"
    )
    .eq("id", id)
    .single<SessionRow>();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: attempts, error: attemptsError } = await supabase
    .from("attempts")
    .select(
      "question_id, selected_option_id, is_correct, time_taken_seconds, streak_at_time, difficulty_band_at_time, question_order, points_earned"
    )
    .eq("session_id", id)
    .order("question_order", { ascending: true });

  if (attemptsError) {
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 }
    );
  }

  const { data: subjectSummaries, error: summariesError } = await supabase
    .from("session_subject_summaries")
    .select(
      "subject_id, questions_answered, correct_count, accuracy_percent, total_time_seconds, avg_time_per_question, max_streak_in_subject"
    )
    .eq("session_id", id);

  if (summariesError) {
    return NextResponse.json(
      { error: "Failed to fetch subject summaries" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    session,
    attempts: attempts ?? [],
    subject_summaries: subjectSummaries ?? [],
  });
}

