// app/api/sessions/sudden-death/answer/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { endSuddenDeathSession } from "@/lib/results/suddenDeathResult";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service role configuration");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const TIME_MAP: Record<string, number> = {
  recall: 15,
  theory: 15,
  application: 25,
  calculation: 50,
  multi_step: 65,
};

const NETWORK_GRACE_SECONDS = 3;
const MAX_DIFFICULTY_LEVEL = 7;

const STREAK_THRESHOLDS: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 8,
};

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

  const { session_id, selected_option_id, nonce } = body;

  if (!session_id || !selected_option_id || !nonce) {
    return NextResponse.json(
      { error: "session_id, selected_option_id, and nonce are required" },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();

  const { data: sdSession, error: sdError } = await supabase
    .from("sd_active_sessions")
    .select("*")
    .eq("session_id", session_id)
    .eq("user_id", userId)
    .single();

  if (sdError || !sdSession) {
    return NextResponse.json(
      { error: "Session not found or already ended" },
      { status: 404 }
    );
  }

  if (sdSession.current_nonce !== nonce) {
    return NextResponse.json(
      { error: "Invalid or expired question state" },
      { status: 409 }
    );
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("id, subject_id, topic_id, difficulty_level, resolved_question_type, correct_option_id")
    .eq("id", sdSession.current_question_id)
    .single();

  if (questionError || !question) {
    return NextResponse.json({ error: "Question not found" }, { status: 500 });
  }

  const servedAt = new Date(sdSession.question_served_at).getTime();
  const answeredAt = Date.now();
  const actualTimeSpentSeconds = (answeredAt - servedAt) / 1000;

  const timeLimit = (TIME_MAP[question.resolved_question_type] ?? 15) + NETWORK_GRACE_SECONDS;
  const timedOut = actualTimeSpentSeconds > timeLimit;
  const isCorrect = !timedOut && selected_option_id === question.correct_option_id;

  await supabase
    .from("exam_session_questions")
    .update({
      selected_answer: timedOut ? null : selected_option_id,
      is_correct: isCorrect,
      time_spent_seconds: Math.round(actualTimeSpentSeconds),
    })
    .eq("session_id", session_id)
    .eq("question_id", question.id);

  const { error: diffError } = await supabase.rpc("update_question_difficulty", {
    p_session_id: session_id,
    p_user_id: userId,
  });
  if (diffError) {
    console.error("[sudden-death/answer] difficulty update failed:", diffError.message);
  }

  if (!isCorrect) {
    const result = await endSuddenDeathSession(supabase, session_id, userId, sdSession, timedOut);
    return NextResponse.json({ status: "ended", timed_out: timedOut, result });
  }

  const newStreak = sdSession.current_streak + 1;
  const requiredStreak = STREAK_THRESHOLDS[sdSession.current_difficulty_band] ?? 8;

  let newDifficultyBand = sdSession.current_difficulty_band;
  let resetStreak = newStreak;

  const atMaxLevel = sdSession.current_difficulty_band >= MAX_DIFFICULTY_LEVEL;

  if (!atMaxLevel && newStreak >= requiredStreak) {
    newDifficultyBand = Math.min(sdSession.current_difficulty_band + 1, MAX_DIFFICULTY_LEVEL);
    resetStreak = 0;
  }

  const { data: nextQuestions, error: nextFetchError } = await supabase
    .from("questions")
    .select(`
      id,
      subject_id,
      topic_id,
      difficulty_level,
      resolved_question_type,
      question_text,
      correct_option_id,
      question_options (
        id,
        option_text,
        position
      )
    `)
    .eq("difficulty_level", newDifficultyBand)
    .eq("status", "active")
    .neq("id", question.id)
    .limit(10);

  if (nextFetchError || !nextQuestions?.length) {
    const result = await endSuddenDeathSession(
      supabase,
      session_id,
      userId,
      { ...sdSession, current_streak: resetStreak, current_difficulty_band: newDifficultyBand },
      false
    );
    return NextResponse.json({ status: "ended", reason: "no_more_questions", result });
  }

  const nextQuestion = nextQuestions[Math.floor(Math.random() * nextQuestions.length)];
  nextQuestion.question_options = (nextQuestion.question_options ?? []).sort(
    (a: any, b: any) => a.position - b.position
  );

  const newNonce = crypto.randomUUID();

  const { count } = await supabase
    .from("exam_session_questions")
    .select("id", { count: "exact", head: true })
    .eq("session_id", session_id);

  const nextPosition = (count ?? 0) + 1;

  await supabase.from("exam_session_questions").insert({
    session_id,
    question_id: nextQuestion.id,
    subject_id: nextQuestion.subject_id,
    topic_id: nextQuestion.topic_id,
    difficulty_level: nextQuestion.difficulty_level,
    resolved_question_type: nextQuestion.resolved_question_type,
    position: nextPosition,
    correct_option_id: nextQuestion.correct_option_id,
    selected_answer: null,
    is_correct: null,
    time_spent_seconds: null,
    change_count: 0,
    answer_history: [],
  });

  await supabase
    .from("sd_active_sessions")
    .update({
      current_question_id: nextQuestion.id,
      question_served_at: new Date().toISOString(),
      current_nonce: newNonce,
      current_difficulty_band: newDifficultyBand,
      current_streak: resetStreak,
    })
    .eq("session_id", session_id);

  const { correct_option_id, ...safeQuestion } = nextQuestion;
  const nextTimeLimit = (TIME_MAP[nextQuestion.resolved_question_type] ?? 15) + NETWORK_GRACE_SECONDS;

  return NextResponse.json({
    status: "continue",
    current_difficulty_band: newDifficultyBand,
    current_streak: resetStreak,
    leveled_up: newDifficultyBand !== sdSession.current_difficulty_band,
    nonce: newNonce,
    time_limit_seconds: nextTimeLimit,
    question: safeQuestion,
  });
      }
