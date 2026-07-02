import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

interface AttemptInput {
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  time_taken_seconds: number;
  streak_at_time: number;
  difficulty_band_at_time: number;
  question_order: number;
}

interface SubjectSummaryInput {
  subject_id: string;
  questions_answered: number;
  correct_count: number;
  accuracy_percent: number;
  total_time_seconds: number;
  avg_time_per_question: number;
  max_streak_in_subject: number;
}

interface CompleteSessionBody {
  session_id: string;
  completed_at: string;
  total_time_seconds: number;
  correct_count: number;
  overall_accuracy_percent: number;
  overall_avg_time_per_question: number;
  max_streak: number;
  attempts: AttemptInput[];
  subject_summaries: SubjectSummaryInput[];
}

interface SessionRow {
  id: string;
  user_id: string;
  mode: string;
  variant: string;
  is_completed: boolean;
  total_questions: number;
}

interface Last20Session {
  id: string;
  correct_count: number;
  total_questions: number;
  overall_avg_time_per_question: number;
  max_streak: number;
}

interface HardAttempt {
  is_correct: boolean;
  difficulty_band_at_time: number;
}

function getTierFromComposite(composite: number, sessionsCounted: number): string {
  if (sessionsCounted < 5) return "unranked";
  if (composite <= 25) return "recruit";
  if (composite <= 50) return "scholar";
  if (composite <= 70) return "expert";
  if (composite <= 85) return "master";
  return "legend";
}

function getDifficultyBandFromTier(tier: string): number {
  switch (tier) {
    case "unranked":
    case "recruit":
      return 1;
    case "scholar":
      return 2;
    case "expert":
      return 3;
    case "master":
      return 4;
    case "legend":
      return 5;
    default:
      return 1;
  }
}

export async function POST(request: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Service-role Supabase client (inline) ───────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
  // ── Parse & validate body ───────────────────────────────────
  let body: CompleteSessionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    session_id,
    completed_at,
    total_time_seconds,
    correct_count,
    overall_accuracy_percent,
    overall_avg_time_per_question,
    max_streak,
    attempts,
    subject_summaries,
  } = body;

  if (!session_id || !Array.isArray(attempts) || !Array.isArray(subject_summaries)) {
    return NextResponse.json(
      { error: "Missing required fields: session_id, attempts, or subject_summaries" },
      { status: 400 }
    );
  }

  // ── Fetch session ───────────────────────────────────────────
  const { data: sessionRow, error: sessionError } = await supabase
    .from("sessions")
    .select("id, user_id, mode, variant, is_completed, total_questions")
    .eq("id", session_id)
    .single<SessionRow>();

  if (sessionError || !sessionRow) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (sessionRow.user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sessionRow.is_completed) {
    return NextResponse.json({ error: "Session already completed" }, { status: 400 });
  }

  if (sessionRow.mode === "sudden_death") {
    return NextResponse.json(
      { error: "Use /api/sessions/sd/answer for sudden_death mode" },
      { status: 400 }
    );
  }

  const isFullyCompleted = attempts.length >= sessionRow.total_questions;

  // ── Time anomaly flagging ───────────────────────────────────
  let isFlagged = false;
  let flagReason: string | null = null;
  if (total_time_seconds < attempts.length * 2) {
    isFlagged = true;
    flagReason = "time_anomaly";
  }

  // ── Bulk insert attempts ─────────────────────────────────────
  const attemptsToInsert = attempts.map((a) => ({
    session_id,
    user_id: userId,
    question_id: a.question_id,
    selected_option_id: a.selected_option_id,
    is_correct: a.is_correct,
    time_taken_seconds: a.time_taken_seconds,
    streak_at_time: a.streak_at_time,
    difficulty_band_at_time: a.difficulty_band_at_time,
    question_order: a.question_order,
    points_earned: 0,
  }));

  const { error: attemptsError } = await supabase
    .from("attempts")
    .insert(attemptsToInsert);

  if (attemptsError) {
    console.error("Failed to insert attempts:", attemptsError);
    return NextResponse.json(
      { error: "Failed to save attempts" },
      { status: 500 }
    );
  }

  // ── Bulk insert subject summaries ────────────────────────────
  const summariesToInsert = subject_summaries.map((s) => ({
    session_id,
    user_id: userId,
    subject_id: s.subject_id,
    questions_answered: s.questions_answered,
    correct_count: s.correct_count,
    accuracy_percent: s.accuracy_percent,
    total_time_seconds: s.total_time_seconds,
    avg_time_per_question: s.avg_time_per_question,
    max_streak_in_subject: s.max_streak_in_subject,
    gems_contribution: 0,
  }));

  const { error: summariesError } = await supabase
    .from("session_subject_summaries")
    .insert(summariesToInsert);

  if (summariesError) {
    console.error("Failed to insert subject summaries:", summariesError);
    return NextResponse.json(
      { error: "Failed to save subject summaries" },
      { status: 500 }
    );
  }

  // ── Update session row ─────────────────────────────────────
  const sessionUpdatePayload = {
    is_completed: true,
    completed_at,
    total_time_seconds,
    correct_count,
    overall_accuracy_percent,
    overall_avg_time_per_question,
    max_streak,
    base_points: 0,
    bonus_points: 0,
    total_points: 0,
    gems_earned: 0,
    ...(isFlagged ? { is_flagged: true, flag_reason: flagReason } : {}),
  };

  const { error: sessionUpdateError } = await supabase
    .from("sessions")
    .update(sessionUpdatePayload)
    .eq("id", session_id);

  if (sessionUpdateError) {
    console.error("Failed to update session:", sessionUpdateError);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }

  // ── Upsert user_question_seen ────────────────────────────────
  const answeredAttempts = attempts.filter(
    (a) => a.selected_option_id !== null && a.selected_option_id !== undefined
  );

  if (answeredAttempts.length > 0) {
    const seenRows = answeredAttempts.map((a) => ({
      user_id: userId,
      question_id: a.question_id,
      last_seen_at: new Date().toISOString(),
      times_seen: 1,
    }));

    const { error: seenError } = await supabase
      .from("user_question_seen")
      .upsert(seenRows, {
        onConflict: "user_id,question_id",
        ignoreDuplicates: false,
      });

    if (seenError) {
      console.error("Failed to upsert user_question_seen:", seenError);
      // Non-fatal — don't abort the request
    }
  }

  // ── Update users table ───────────────────────────────────────
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Fetch current user row for streak logic
  const { data: userRow, error: userFetchError } = await supabase
    .from("users")
    .select("last_active_date, daily_streak_count, total_sessions_completed, current_rank_tier")
    .eq("id", userId)
    .single();

  if (userFetchError) {
    console.error("Failed to fetch user row:", userFetchError);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }

  let newDailyStreak = userRow.daily_streak_count ?? 0;

  if (isFullyCompleted) {
    const lastActive = userRow.last_active_date;
    if (lastActive) {
      const lastDate = new Date(lastActive + "T00:00:00");
      const todayDate = new Date(today + "T00:00:00");
      const diffMs = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newDailyStreak = (userRow.daily_streak_count ?? 0) + 1;
      } else if (diffDays > 1) {
        newDailyStreak = 1;
      }
      // diffDays === 0 → no change
    } else {
      newDailyStreak = 1;
    }
  }

  const { error: userUpdateError } = await supabase
    .from("users")
    .update({
      total_sessions_completed: (userRow.total_sessions_completed ?? 0) + 1,
      last_active_date: today,
      ...(isFullyCompleted ? { daily_streak_count: newDailyStreak } : {}),
    })
    .eq("id", userId);

  if (userUpdateError) {
    console.error("Failed to update users:", userUpdateError);
    return NextResponse.json(
      { error: "Failed to update user stats" },
      { status: 500 }
    );
  }

  // ── Rank recalculation (only if fully completed) ─────────────
  let rankChanged: boolean | undefined;
  let newTier: string | undefined;
  let previousTier: string | undefined;
  let compositeScore: number | undefined;

  if (isFullyCompleted) {
    // Fetch last 20 completed non-sudden_death sessions
    const { data: last20Sessions, error: last20Error } = await supabase
      .from("sessions")
      .select("id, correct_count, total_questions, overall_avg_time_per_question, max_streak")
      .eq("user_id", userId)
      .eq("is_completed", true)
      .neq("mode", "sudden_death")
      .order("completed_at", { ascending: false })
      .limit(20);

    if (last20Error) {
      console.error("Failed to fetch last 20 sessions:", last20Error);
    } else if (last20Sessions && last20Sessions.length > 0) {
      const sessions = last20Sessions as Last20Session[];
      const sessionIds = sessions.map((s) => s.id);

      // Fetch hard attempts for depth score
      const { data: hardAttempts, error: hardError } = await supabase
        .from("attempts")
        .select("is_correct, difficulty_band_at_time")
        .in("session_id", sessionIds)
        .gte("difficulty_band_at_time", 4);

      if (hardError) {
        console.error("Failed to fetch hard attempts:", hardError);
      }

      const hardData = (hardAttempts ?? []) as HardAttempt[];
      const totalHardAttempts = hardData.length;
      const hardAttemptsCorrect = hardData.filter((a) => a.is_correct).length;

      // Compute sub-scores
      const accuracyScore =
        sessions.reduce((sum, s) => sum + s.correct_count / s.total_questions, 0) /
        sessions.length *
        100;

      const avgTime =
        sessions.reduce((sum, s) => sum + s.overall_avg_time_per_question, 0) /
        sessions.length;
      const rawSpeed = (avgTime / 60) * 100;
      const clampedSpeed = Math.max(0, Math.min(100, rawSpeed));
      const speedScore = 100 - clampedSpeed;

      const consistencyScore =
        sessions.reduce((sum, s) => sum + s.max_streak / s.total_questions, 0) /
        sessions.length *
        100;

      const depthScore =
        totalHardAttempts > 0
          ? (hardAttemptsCorrect / totalHardAttempts) * 100
          : 0;

      compositeScore =
        accuracyScore * 0.35 +
        speedScore * 0.25 +
        consistencyScore * 0.20 +
        depthScore * 0.20;

      const sessionsCounted = sessions.length;
      const computedTier = getTierFromComposite(compositeScore, sessionsCounted);

      // Upsert rank_scores
      const { error: rankUpsertError } = await supabase.from("rank_scores").upsert(
        {
          user_id: userId,
          accuracy_score: accuracyScore,
          speed_score: speedScore,
          consistency_score: consistencyScore,
          depth_score: depthScore,
          composite_score: compositeScore,
          tier: computedTier,
          last_calculated_at: new Date().toISOString(),
          sessions_counted: sessionsCounted,
        },
        { onConflict: "user_id", ignoreDuplicates: false }
      );

      if (rankUpsertError) {
        console.error("Failed to upsert rank_scores:", rankUpsertError);
      } else {
        previousTier = userRow.current_rank_tier ?? undefined;
        newTier = computedTier;
        rankChanged = previousTier !== newTier;

        const newDifficultyBand = getDifficultyBandFromTier(computedTier);

        // Update users.current_rank_tier & current_difficulty_band
        const { error: tierUpdateError } = await supabase
          .from("users")
          .update({
            current_rank_tier: computedTier,
            current_difficulty_band: newDifficultyBand,
          })
          .eq("id", userId);

        if (tierUpdateError) {
          console.error("Failed to update user tier:", tierUpdateError);
        }
      }
    }
  }

  // ── Response ────────────────────────────────────────────────
  const response: {
    is_fully_completed: boolean;
    daily_streak: number;
    rank_changed?: boolean;
    new_tier?: string;
    previous_tier?: string;
    composite_score?: number;
  } = {
    is_fully_completed: isFullyCompleted,
    daily_streak: newDailyStreak,
  };

  if (rankChanged !== undefined) {
    response.rank_changed = rankChanged;
    response.new_tier = newTier;
    response.previous_tier = previousTier;
    response.composite_score = compositeScore;
  }

  return NextResponse.json(response);
}

