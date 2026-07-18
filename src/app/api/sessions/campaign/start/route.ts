// app/api/session/campaign/start/route.ts

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

interface TopicSelection {
  topic_id: string;
  question_count: number;
}

interface SubjectSelection {
  subject_id: string;
  topics: TopicSelection[];
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

  const { subjects, difficulty_level } = body;

  // ── 1. Basic payload validation ──────────────────────────────────────────
  if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json(
      { error: "At least one subject is required" },
      { status: 400 }
    );
  }

  if (difficulty_level !== undefined) {
    if (
      typeof difficulty_level !== "number" ||
      difficulty_level < 1 ||
      difficulty_level > 7
    ) {
      return NextResponse.json(
        { error: "difficulty_level must be between 1 and 7" },
        { status: 400 }
      );
    }
  }

  const supabase = getServiceRoleClient();

  // ── 2. Fetch user profile ────────────────────────────────────────────────
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

  // ── 3. Fetch English subject ID ──────────────────────────────────────────
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

  const allowedSubjectIds = [englishSubject.id, ...user.jamb_subjects];

  // ── 4. Resolve difficulty ────────────────────────────────────────────────
  const resolvedDifficulty = difficulty_level ?? user.current_difficulty_band ?? 2;

  // ── 5. Validate subjects and topics ─────────────────────────────────────
  let totalQuestions = 0;

  for (const subject of subjects as SubjectSelection[]) {
    // Subject must be in user's combo
    if (!allowedSubjectIds.includes(subject.subject_id)) {
      return NextResponse.json(
        { error: `You are not enrolled in subject: ${subject.subject_id}` },
        { status: 403 }
      );
    }

    // Must have at least one topic
    if (!subject.topics?.length) {
      return NextResponse.json(
        { error: `Subject ${subject.subject_id} must have at least one topic` },
        { status: 400 }
      );
    }

    let subjectTotal = 0;

    for (const topic of subject.topics) {
      // question_count validation
      if (
        typeof topic.question_count !== "number" ||
        topic.question_count < 1 ||
        topic.question_count > 30
      ) {
        return NextResponse.json(
          {
            error: `question_count for topic ${topic.topic_id} must be between 1 and 30`,
          },
          { status: 400 }
        );
      }

      // Validate topic belongs to subject
      const { data: topicRow } = await supabase
        .from("topics")
        .select("id")
        .eq("id", topic.topic_id)
        .eq("subject_id", subject.subject_id)
        .single();

      if (!topicRow) {
        return NextResponse.json(
          {
            error: `Topic ${topic.topic_id} does not belong to subject ${subject.subject_id}`,
          },
          { status: 400 }
        );
      }

      subjectTotal += topic.question_count;
    }

    // Per subject cap
    if (subjectTotal > 50) {
      return NextResponse.json(
        {
          error: `Subject ${subject.subject_id} exceeds maximum of 50 questions per session`,
        },
        { status: 400 }
      );
    }

    totalQuestions += subjectTotal;
  }

  // Total session cap
  if (totalQuestions > 200) {
    return NextResponse.json(
      { error: "Total questions cannot exceed 200 per session" },
      { status: 400 }
    );
  }

  // ── 6. Rate limit check ──────────────────────────────────────────────────
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

  // ── 7. Active session check ──────────────────────────────────────────────
  const { data: activeSession } = await supabase
    .from("exam_sessions")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["pending", "active"])
    .single();

  if (activeSession) {
    return NextResponse.json(
      {
        error: "You have an active session. Complete it before starting a new one.",
      },
      { status: 409 }
    );
  }

  // ── 8. Fetch questions per topic ─────────────────────────────────────────
  const allQuestions: any[] = [];
  const shortfallErrors: string[] = [];

  for (const subject of subjects as SubjectSelection[]) {
    for (const topic of subject.topics) {
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
        .eq("subject_id", subject.subject_id)
        .eq("topic_id", topic.topic_id)
        .eq("difficulty_level", resolvedDifficulty)
        .eq("status", "active")
        .limit(topic.question_count * 2); // fetch 2x for shuffle headroom

      if (fetchError) {
        console.error(
          `[campaign] fetch failed for topic ${topic.topic_id}:`,
          fetchError
        );
        shortfallErrors.push(
          `Topic ${topic.topic_id}: fetch error`
        );
        continue;
      }

      if (!questions?.length) {
        shortfallErrors.push(
          `Topic ${topic.topic_id}: no questions available at Level ${resolvedDifficulty}`
        );
        continue;
      }

      if (questions.length < topic.question_count) {
        shortfallErrors.push(
          `Topic ${topic.topic_id}: requested ${topic.question_count} but only ${questions.length} available at Level ${resolvedDifficulty}`
        );
        continue;
      }

      // Shuffle and take requested count
      const picked = questions
        .sort(() => Math.random() - 0.5)
        .slice(0, topic.question_count)
        .map((q) => ({
          ...q,
          question_options: (q.question_options ?? []).sort(
            (a: any, b: any) => a.position - b.position
          ),
        }));

      allQuestions.push(...picked);
    }
  }

  // Return clear error if any topic had shortfall
  if (shortfallErrors.length > 0) {
    return NextResponse.json(
      {
        error: "Some topics do not have enough questions",
        details: shortfallErrors,
      },
      { status: 422 }
    );
  }

  // ── 9. Create exam_sessions row ──────────────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: userId,
      mode: "campaign",
      status: "active",
      is_completed: false,
      total_questions: allQuestions.length,
      correct_count: 0,
      total_time_seconds: 0, // self paced — no time limit
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      gems_earned: 0,
      is_flagged: false,
      missed_heartbeats: 0,
      total_absence_events: 0,
      auto_submitted: false,
      started_at: new Date().toISOString(),
      expires_at: null, // no expiry for campaign
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error("[campaign] session insert failed:", sessionError);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }

  // ── 10. Insert exam_session_questions ────────────────────────────────────
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
    time_spent_seconds: null, // null for campaign — no time tracking
    change_count: 0,
    answer_history: [],
  }));

  const { error: questionsError } = await supabase
    .from("exam_session_questions")
    .insert(questionRows);

  if (questionsError) {
    console.error(
      "[campaign] exam_session_questions insert failed:",
      questionsError
    );
    await supabase.from("exam_sessions").delete().eq("id", session.id);
    return NextResponse.json(
      { error: "Failed to initialize session questions" },
      { status: 500 }
    );
  }

  // ── 11. Strip correct answers before response ────────────────────────────
  const safeQuestions = allQuestions.map(({ correct_option_id, ...q }) => q);

  return NextResponse.json({
    session_id: session.id,
    mode: "campaign",
    total_questions: allQuestions.length,
    difficulty_level: resolvedDifficulty,
    started_at: session.started_at,
    expires_at: null,
    questions: safeQuestions,
  });
}
