// app/api/sessions/sudden-death/start/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

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

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("jamb_subjects, current_difficulty_band")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  if (!user.jamb_subjects?.length) {
    return NextResponse.json(
      { error: "Please complete your subject selection." },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const { count: todayCount } = await supabase
    .from("exam_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("started_at", `${today}T00:00:00Z`)
    .lt("started_at", `${tomorrow}T00:00:00Z`);

  if ((todayCount ?? 0) >= 20) {
    return NextResponse.json(
      { error: "Daily session limit reached." },
      { status: 429 }
    );
  }

  const { data: activeSession } = await supabase
    .from("exam_sessions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["pending", "active"])
    .single();

  if (activeSession) {
    return NextResponse.json(
      { error: "You have an active session. Complete it before starting a new one." },
      { status: 409 }
    );
  }

  const { data: englishSubject } = await supabase
    .from("subjects")
    .select("id")
    .eq("slug", "english")
    .single();

  if (!englishSubject) {
    return NextResponse.json(
      { error: "English subject not found" },
      { status: 500 }
    );
  }

  const allSubjectIds = [
    englishSubject.id,
    ...user.jamb_subjects.filter((id: string) => id !== englishSubject.id),
  ];

  const baselineDifficulty = user.current_difficulty_band ?? 2;

  const { data: questions, error: fetchError } = await supabase
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
    .in("subject_id", allSubjectIds)
    .eq("difficulty_level", baselineDifficulty)
    .eq("status", "active")
    .limit(10);

  if (fetchError || !questions?.length) {
    return NextResponse.json(
      { error: "No questions available at your current level. Try again later." },
      { status: 503 }
    );
  }

  const firstQuestion = questions[Math.floor(Math.random() * questions.length)];
  firstQuestion.question_options = (firstQuestion.question_options ?? []).sort(
    (a: any, b: any) => a.position - b.position
  );

  const now = new Date();

  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: userId,
      mode: "sudden_death",
      status: "active",
      is_completed: false,
      total_questions: 0,
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
      started_at: now.toISOString(),
      expires_at: null,
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error("[sudden-death/start] session insert failed:", sessionError);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  const { error: questionInsertError } = await supabase
    .from("exam_session_questions")
    .insert({
      session_id: session.id,
      question_id: firstQuestion.id,
      subject_id: firstQuestion.subject_id,
      topic_id: firstQuestion.topic_id,
      difficulty_level: firstQuestion.difficulty_level,
      resolved_question_type: firstQuestion.resolved_question_type,
      position: 1,
      correct_option_id: firstQuestion.correct_option_id,
      selected_answer: null,
      is_correct: null,
      time_spent_seconds: null,
      change_count: 0,
      answer_history: [],
    });

  if (questionInsertError) {
    console.error("[sudden-death/start] question insert failed:", questionInsertError);
    await supabase.from("exam_sessions").delete().eq("id", session.id);
    return NextResponse.json(
      { error: "Failed to initialize session question" },
      { status: 500 }
    );
  }

  const nonce = crypto.randomUUID();

  const { error: sdError } = await supabase
    .from("sd_active_sessions")
    .insert({
      session_id: session.id,
      user_id: userId,
      current_question_id: firstQuestion.id,
      question_served_at: now.toISOString(),
      current_nonce: nonce,
      current_difficulty_band: baselineDifficulty,
      baseline_difficulty_band: baselineDifficulty,
      current_streak: 0,
    });

  if (sdError) {
    console.error("[sudden-death/start] sd_active_sessions insert failed:", sdError);
    await supabase.from("exam_sessions").delete().eq("id", session.id);
    return NextResponse.json(
      { error: "Failed to initialize sudden death state" },
      { status: 500 }
    );
  }

  const { correct_option_id, ...safeQuestion } = firstQuestion;
  const timeLimit = (TIME_MAP[firstQuestion.resolved_question_type] ?? 15) + NETWORK_GRACE_SECONDS;

  return NextResponse.json({
    session_id: session.id,
    mode: "sudden_death",
    baseline_difficulty_band: baselineDifficulty,
    current_difficulty_band: baselineDifficulty,
    current_streak: 0,
    nonce,
    time_limit_seconds: timeLimit,
    question: safeQuestion,
  });
}
