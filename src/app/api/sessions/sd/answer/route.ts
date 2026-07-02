import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { fetchQuestions } from "@/lib/questions/fetchQuestions";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service role configuration");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function resolveDifficultyBand(streak: number): number {
  if (streak >= 40) return 5;
  if (streak >= 25) return 4;
  if (streak >= 15) return 3;
  if (streak >= 8) return 2;
  return 1;
}

function resolveStreakTier(streak: number): string | null {
  if (streak >= 15) return "Certified";
  if (streak >= 12) return "Legendary";
  if (streak >= 9) return "Unstoppable";
  if (streak >= 6) return "On Fire";
  if (streak >= 4) return "Heating Up";
  if (streak >= 2) return "On Point";
  return null;
}

function getTodayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { session_id, question_id, selected_option_id, time_taken_seconds, nonce } = body;

  if (!session_id || !question_id || !selected_option_id || time_taken_seconds === undefined || !nonce) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();

  const { data: sd, error: sdError } = await supabase
    .from("sd_active_sessions")
    .select("*")
    .eq("session_id", session_id)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (sdError || !sd) {
    return NextResponse.json({ error: "Active session not found" }, { status: 404 });
  }

  if (nonce !== sd.current_nonce) {
    return NextResponse.json({ error: "Invalid nonce" }, { status: 400 });
  }

  if (question_id !== sd.current_question_id) {
    return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  }

  const timeExpired = time_taken_seconds > 32;

  const { data: question, error: qError } = await supabase
    .from("questions")
    .select("correct_option_id, explanation")
    .eq("id", question_id)
    .single();

  if (qError || !question) {
    return NextResponse.json({ error: "Question not found" }, { status: 500 });
  }

  const isCorrect = !timeExpired && selected_option_id === question.correct_option_id;

  const { error: attemptError } = await supabase.from("attempts").insert({
    session_id,
    user_id: userId,
    question_id,
    selected_option_id,
    is_correct: isCorrect,
    time_taken_seconds,
    streak_at_time: sd.streak_count,
    difficulty_band_at_time: sd.current_difficulty_band,
    question_order: sd.questions_answered + 1,
    points_earned: 0,
  });

  if (attemptError) {
    console.error("Attempt insert error:", attemptError);
    return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
  }

  if (!isCorrect) {
    const questionsSurvived = sd.questions_answered;
    const totalAnswered = sd.questions_answered + 1;
    const accuracy = totalAnswered > 0 ? (sd.streak_count / totalAnswered) * 100 : 0;

    await supabase
      .from("sd_active_sessions")
      .update({ is_active: false })
      .eq("session_id", session_id);

    await supabase
      .from("sessions")
      .update({
        is_completed: true,
        correct_count: sd.streak_count,
        max_streak: sd.streak_count,
        total_questions: totalAnswered,
        overall_accuracy_percent: accuracy,
        base_points: 0,
        total_points: 0,
        gems_earned: 0,
      })
      .eq("id", session_id);

    const { data: existingRecord } = await supabase
      .from("sudden_death_records")
      .select("questions_survived")
      .eq("user_id", userId)
      .single();

    const isPersonalBest = !existingRecord || questionsSurvived > existingRecord.questions_survived;

    if (isPersonalBest) {
      await supabase.from("sudden_death_records").upsert({
        user_id: userId,
        session_id,
        questions_survived: questionsSurvived,
        achieved_at: new Date().toISOString(),
      });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("total_sessions_completed, last_active_date, daily_streak_count")
      .eq("id", userId)
      .single();

    const today = getTodayIso();
    const yesterday = getYesterdayIso();
    let newDailyStreak = userData?.daily_streak_count ?? 0;

    if (userData?.last_active_date === yesterday) {
      newDailyStreak += 1;
    } else if (userData?.last_active_date !== today) {
      newDailyStreak = 1;
    }

    await supabase
      .from("users")
      .update({
        total_sessions_completed: (userData?.total_sessions_completed ?? 0) + 1,
        last_active_date: today,
        daily_streak_count: newDailyStreak,
      })
      .eq("id", userId);

    return NextResponse.json({
      is_correct: false,
      correct_option_id: question.correct_option_id,
      explanation: question.explanation,
      session_ended: true,
      questions_survived: questionsSurvived,
      is_personal_best: isPersonalBest,
    });
  }

  const newStreak = sd.streak_count + 1;
  const resolvedBand = resolveDifficultyBand(newStreak);
  const newDifficultyBand = Math.max(sd.current_difficulty_band, resolvedBand);
  const newNonce = crypto.randomUUID();

  // Use allowed_subject_ids cached on sd_active_sessions
  const allowedSubjectIds: string[] = sd.allowed_subject_ids ?? [];

  const { questions } = await fetchQuestions({
    userId,
    mode: "sudden_death",
    count: 1,
    startingDifficultyBand: newDifficultyBand,
    allowedSubjectIds,
    supabase,
  });

  if (!questions || questions.length === 0) {
    const questionsSurvived = sd.questions_answered + 1;

    await supabase
      .from("sd_active_sessions")
      .update({ is_active: false })
      .eq("session_id", session_id);

    await supabase
      .from("sessions")
      .update({
        is_completed: true,
        correct_count: newStreak,
        max_streak: newStreak,
        total_questions: questionsSurvived,
        overall_accuracy_percent: 100,
        base_points: 0,
        total_points: 0,
        gems_earned: 0,
      })
      .eq("id", session_id);

    return NextResponse.json({
      is_correct: true,
      streak_count: newStreak,
      streak_tier: resolveStreakTier(newStreak),
      session_ended: true,
      questions_survived: questionsSurvived,
      pool_exhausted: true,
    });
  }

  const nextQuestion = questions[0];

  const { error: sdUpdateError } = await supabase
    .from("sd_active_sessions")
    .update({
      current_question_id: nextQuestion.id,
      question_served_at: new Date().toISOString(),
      current_nonce: newNonce,
      streak_count: newStreak,
      current_difficulty_band: newDifficultyBand,
      questions_answered: sd.questions_answered + 1,
    })
    .eq("session_id", session_id);

  if (sdUpdateError) {
    console.error("SD session update error:", sdUpdateError);
    return NextResponse.json({ error: "Failed to update session state" }, { status: 500 });
  }

  const { correct_option_id, ...questionWithoutAnswer } = nextQuestion;

  return NextResponse.json({
    is_correct: true,
    streak_count: newStreak,
    streak_tier: resolveStreakTier(newStreak),
    next_question: questionWithoutAnswer,
    nonce: newNonce,
    time_limit_seconds: 30,
  });
}
