// app/api/sessions/quick-fire/start/route.ts

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

const QUESTIONS_PER_SUBJECT = 5;
const TOTAL_QUESTIONS = 20;

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  // ── 1. Parallel: user profile, English subject, rate limit, active session ─
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [userResult, englishResult, rateLimitResult, activeSessionResult] =
    await Promise.all([
      supabase
        .from("users")
        .select("jamb_subjects, current_difficulty_band")
        .eq("id", userId)
        .single(),
      supabase.from("subjects").select("id").eq("slug", "english").single(),
      supabase
        .from("exam_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("started_at", `${today}T00:00:00Z`)
        .lt("started_at", `${tomorrow}T00:00:00Z`),
      supabase
        .from("exam_sessions")
        .select("id")
        .eq("user_id", userId)
        .in("status", ["pending", "active"])
        .single(),
    ]);

  const { data: user, error: userError } = userResult;

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  if (!user.jamb_subjects?.length) {
    return NextResponse.json(
      { error: "Please complete your subject selection." },
      { status: 400 }
    );
  }

  const { count: todayCount } = rateLimitResult;
  if ((todayCount ?? 0) >= 20) {
    return NextResponse.json(
      { error: "Daily session limit reached." },
      { status: 429 }
    );
  }

  const { data: activeSession } = activeSessionResult;
  if (activeSession) {
    return NextResponse.json(
      { error: "You have an active session. Complete it before starting a new one." },
      { status: 409 }
    );
  }

  const { data: englishSubject } = englishResult;
  if (!englishSubject) {
    return NextResponse.json(
      { error: "English subject not found" },
      { status: 500 }
    );
  }

  const englishSubjectId = englishSubject.id;
  const allSubjectIds = [
    englishSubjectId,
    ...user.jamb_subjects.filter((id: string) => id !== englishSubjectId),
  ];

  const difficultyBand = user.current_difficulty_band ?? 2;

  // ── 2. Parallel: fetch questions for all subjects simultaneously ───────────
  const subjectQuestionPromises = allSubjectIds.map((subjectId) =>
    supabase
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
      .eq("subject_id", subjectId)
      .eq("difficulty_level", difficultyBand)
      .eq("status", "active")
      .limit(QUESTIONS_PER_SUBJECT * 4)
  );

  const subjectResults = await Promise.all(subjectQuestionPromises);

  const allQuestions: any[] = [];

  for (const { data: questions, error: fetchError } of subjectResults) {
    if (fetchError) {
      console.error("[quickfire] subject fetch failed:", fetchError);
      continue;
    }
    if (!questions?.length) continue;

    const shuffled = questions
      .sort(() => Math.random() - 0.5)
      .slice(0, QUESTIONS_PER_SUBJECT);

    allQuestions.push(...shuffled);
  }

  if (allQuestions.length < TOTAL_QUESTIONS) {
    return NextResponse.json(
      { error: "Not enough questions available. Try again later." },
      { status: 503 }
    );
  }

  // ── 3. Compute total session time from question types ────────────────────
  const totalTimeSeconds = allQuestions.reduce((sum, q) => {
    return sum + (TIME_MAP[q.resolved_question_type] ?? 15);
  }, 0);

  // ── 4. Create exam_sessions row ────────────────────────────────────────────
  const now = new Date();
  const expiresAt = new Date(now.getTime() + totalTimeSeconds * 1000);

  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: userId,
      mode: "quick_fire",
      status: "active",
      is_completed: false,
      total_questions: allQuestions.length,
      correct_count: 0,
      total_time_seconds: totalTimeSeconds,
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      gems_earned: 0,
      is_flagged: false,
      missed_heartbeats: 0,
      total_absence_events: 0,
      auto_submitted: false,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error("[quickfire] session insert failed:", sessionError);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }

  // ── 5. Insert exam_session_questions ─────────────────────────────────────
  const questionRows = allQuestions.map((q, index) => ({
    session_id: session.id,
    question_id: q.id,
    subject_id: q.subject_id,
    topic_id: q.topic_id,
    difficulty_level: q.difficulty_level,
    resolved_question_type: q.resolved_question_type,
    position: index + 1,
    correct_option_id: q.correct_option_id,
    selected_answer: null,
    is_correct: null,
    time_spent_seconds: 0,
    change_count: 0,
    answer_history: [],
  }));

  const { error: questionsError } = await supabase
    .from("exam_session_questions")
    .insert(questionRows);

  if (questionsError) {
    console.error("[quickfire] exam_session_questions insert failed:", questionsError);
    await supabase.from("exam_sessions").delete().eq("id", session.id);
    return NextResponse.json(
      { error: "Failed to initialize session questions" },
      { status: 500 }
    );
  }

  // ── 6. Strip correct answers before response ─────────────────────────────
  const safeQuestions = allQuestions.map(({ correct_option_id, ...q }) => ({
    ...q,
    question_options: q.question_options.sort(
      (a: any, b: any) => a.position - b.position
    ),
  }));

  return NextResponse.json({
    session_id: session.id,
    mode: "quick_fire",
    total_questions: allQuestions.length,
    total_time_seconds: totalTimeSeconds,
    difficulty_band: difficultyBand,
    started_at: session.started_at,
    expires_at: session.expires_at,
    questions: safeQuestions,
  });
}
