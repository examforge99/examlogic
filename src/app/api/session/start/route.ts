import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { fetchQuestions } from "@/lib/questions/fetchQuestions";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const VALID_MODES = ["quick_fire", "campaign", "simulation", "sudden_death"] as const;
const VALID_VARIANTS = ["base", "speed_run", "accuracy_challenge", "endurance"] as const;

const MODE_MULTIPLIERS: Record<string, number> = {
  quick_fire: 1.0,
  campaign: 0.75,
  simulation: 2.0,
  sudden_death: 2.5,
};

const VARIANT_MULTIPLIERS: Record<string, number> = {
  base: 0.75,
  speed_run: 1.25,
  accuracy_challenge: 1.0,
  endurance: 1.5,
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

  const {
    mode,
    variant,
    subject_id,
    topic_id,
    player_chosen_difficulty,
  } = body;

  // ── Validate mode ────────────────────────────────────────────────────────
  if (!mode || !VALID_MODES.includes(mode)) {
    return NextResponse.json(
      { error: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}` },
      { status: 400 }
    );
  }

  // ── Validate campaign ──────────────────────────────────────────────────
  if (mode === "campaign") {
    if (!variant || !VALID_VARIANTS.includes(variant)) {
      return NextResponse.json(
        { error: "Campaign mode requires a valid variant" },
        { status: 400 }
      );
    }
    if (!subject_id || !topic_id) {
      return NextResponse.json(
        { error: "Campaign mode requires subject_id and topic_id" },
        { status: 400 }
      );
    }
  }

  // ── Validate quick_fire ────────────────────────────────────────────────
  if (mode === "quick_fire") {
    if (!player_chosen_difficulty || !["easy", "medium", "hard"].includes(player_chosen_difficulty)) {
      return NextResponse.json(
        { error: "Quick fire mode requires player_chosen_difficulty (easy, medium, hard)" },
        { status: 400 }
      );
    }
  }

  const supabase = getServiceRoleClient();

  // ── Fetch user profile ─────────────────────────────────────────────────
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("jamb_subjects, current_difficulty_band")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.jamb_subjects || !Array.isArray(user.jamb_subjects) || user.jamb_subjects.length === 0) {
    return NextResponse.json(
      { error: "Please complete your subject selection." },
      { status: 400 }
    );
  }

  // ── Fetch English subject ID ───────────────────────────────────────────
  const { data: englishSubject } = await supabase
    .from("subjects")
    .select("id")
    .eq("slug", "english")
    .limit(1)
    .single();

  const englishSubjectId = englishSubject?.id;
  if (!englishSubjectId) {
    return NextResponse.json(
      { error: "English subject not found" },
      { status: 500 }
    );
  }

  const allowedSubjectIds = [englishSubjectId, ...user.jamb_subjects];

  // ── Validate campaign subject enrollment ─────────────────────────────
  if (mode === "campaign") {
    if (!allowedSubjectIds.includes(subject_id)) {
      return NextResponse.json(
        { error: "You are not enrolled in this subject" },
        { status: 400 }
      );
    }
  }

  // ── Resolve starting_difficulty_band ───────────────────────────────────
  let startingDifficultyBand: number;
  if (mode === "quick_fire") {
    const bandMap: Record<string, number> = { easy: 2, medium: 3, hard: 4 };
    startingDifficultyBand = bandMap[player_chosen_difficulty];
  } else if (mode === "simulation") {
    startingDifficultyBand = 2;
  } else {
    startingDifficultyBand = user.current_difficulty_band ?? 1;
  }

  // ── Resolve total_questions ──────────────────────────────────────────
  const totalQuestions: Record<string, number> = {
    quick_fire: 20,
    campaign: 50,
    simulation: 180,
    sudden_death: 40,
  };

  // ── Resolve strikes_remaining ────────────────────────────────────────
  let strikesRemaining: number | null = null;
  if (mode === "campaign" && variant === "accuracy_challenge") {
    strikesRemaining = 3;
  }

  // ── Rate limit check ─────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];
  const { count: todaySessionCount, error: rateError } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("started_at", `${today}T00:00:00Z`)
    .lt("started_at", `${today}T23:59:59Z`);

  if (rateError) {
    console.error("Rate limit check error:", rateError);
  }

  if ((todaySessionCount ?? 0) >= 20) {
    return NextResponse.json(
      { error: "Daily session limit reached." },
      { status: 429 }
    );
  }

  // ── Insert session row ───────────────────────────────────────────────
  const modeMultiplier = MODE_MULTIPLIERS[mode];
  const variantMultiplier = mode === "campaign" ? VARIANT_MULTIPLIERS[variant] : null;

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      mode,
      variant: mode === "campaign" ? variant : null,
      subject_id: subject_id ?? null,
      topic_id: topic_id ?? null,
      started_at: new Date().toISOString(),
      is_completed: false,
      total_questions: totalQuestions[mode],
      correct_count: 0,
      max_streak: 0,
      total_time_seconds: 0,
      overall_accuracy_percent: null,
      overall_avg_time_per_question: null,
      base_points: 0,
      bonus_points: 0,
      total_points: 0,
      gems_earned: 0,
      starting_difficulty_band: startingDifficultyBand,
      mode_multiplier: modeMultiplier,
      variant_multiplier: variantMultiplier,
      strikes_remaining: strikesRemaining,
      is_flagged: false,
      flag_reason: null,
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error("Session creation error:", sessionError);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }

  const sessionId = session.id;

  // ── Sudden Death: special handling ───────────────────────────────────
  if (mode === "sudden_death") {
    const { questions, pool_exhausted, questions_available } = await fetchQuestions({
      userId,
      mode,
      count: 1,
      startingDifficultyBand,
      allowedSubjectIds,
      supabase,
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "No questions available" },
        { status: 500 }
      );
    }

    const firstQuestion = questions[0];
    const nonce = crypto.randomUUID();

    const { error: sdError } = await supabase
      .from("sd_active_sessions")
      .insert({
        session_id: sessionId,
        user_id: userId,
        current_question_id: firstQuestion.id,
        question_served_at: new Date().toISOString(),
        current_nonce: nonce,
        current_difficulty_band: startingDifficultyBand,
      });

    if (sdError) {
      console.error("Sudden death session init error:", sdError);
      return NextResponse.json(
        { error: "Failed to initialize sudden death session" },
        { status: 500 }
      );
    }

    // Strip correct_option_id from question
    const { correct_option_id, ...questionWithoutAnswer } = firstQuestion;

    return NextResponse.json({
      session_id: sessionId,
      mode,
      starting_difficulty_band: startingDifficultyBand,
      time_limit_seconds: 30,
      nonce,
      first_question: questionWithoutAnswer,
    });
  }

  // ── Simulation: grouped by subject ───────────────────────────────────
  if (mode === "simulation") {
    // Resolve other subjects (JAMB subjects excluding English)
    const otherSubjectIds = user.jamb_subjects.filter(
      (id: string) => id !== englishSubjectId
    );

    const { data: otherSubjectsData } = await supabase
      .from("subjects")
      .select("id, slug")
      .in("id", otherSubjectIds);

    const otherSubjects = (otherSubjectsData ?? []).map((s: any) => ({
      id: s.id,
      slug: s.slug,
    }));

    const { questions, pool_exhausted, questions_available } = await fetchQuestions({
      userId,
      mode,
      count: 180,
      englishSubjectId,
      otherSubjects,
      supabase,
    });

    // Group by subject slug
    const grouped: Record<string, typeof questions> = {};
    grouped["english"] = questions.slice(0, 60);
    let idx = 60;
    for (const sub of otherSubjects) {
      grouped[sub.slug] = questions.slice(idx, idx + 40);
      idx += 40;
    }

    return NextResponse.json({
      session_id: sessionId,
      mode,
      variant: null,
      starting_difficulty_band: startingDifficultyBand,
      questions: grouped,
      pool_exhausted,
      questions_available,
    });
  }

  // ── Quick Fire & Campaign ──────────────────────────────────────────
  const { questions, pool_exhausted, questions_available } = await fetchQuestions({
    userId,
    mode,
    count: totalQuestions[mode],
    subjectId: subject_id,
    topicId: topic_id,
    startingDifficultyBand,
    playerChosenDifficulty,
    allowedSubjectIds,
    supabase,
  });

  return NextResponse.json({
    session_id: sessionId,
    mode,
    variant: variant ?? null,
    starting_difficulty_band: startingDifficultyBand,
    questions,
    pool_exhausted,
    questions_available,
  });
                        }
    
