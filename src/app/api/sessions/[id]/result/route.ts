// app/api/session/[id]/result/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = getServiceRoleClient();

  // ── Fetch session ──────────────────────────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "scored")
    .single();

  if (sessionError || !session) {
    // Check if still scoring
    const { data: pending } = await supabase
      .from("exam_sessions")
      .select("status")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (pending?.status === "submitted") {
      return NextResponse.json({ status: "scoring" }, { status: 202 });
    }

    return NextResponse.json({ error: "Result not found" }, { status: 404 });
  }

  // ── Fetch attempts ─────────────────────────────────────────────────────
  const { data: attempts } = await supabase
    .from("attempts")
    .select(`
      question_id,
      subject_id,
      topic_id,
      difficulty_level,
      selected_option_id,
      correct_option_id,
      is_correct,
      time_taken_seconds,
      change_count,
      answer_history,
      question_order
    `)
    .eq("session_id", id)
    .eq("user_id", userId)
    .order("question_order", { ascending: true });

  // ── Fetch subject summaries (simulation only) ──────────────────────────
  let subjectSummaries = null;
  if (session.mode === "simulation") {
    const { data: summaries } = await supabase
      .from("session_subject_summaries")
      .select("*")
      .eq("session_id", id)
      .eq("user_id", userId);

    // Fetch subject names
    const subjectIds = (summaries ?? []).map((s: any) => s.subject_id);
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, name, slug")
      .in("id", subjectIds);

    const subjectMap: Record<string, { name: string; slug: string }> = {};
    (subjects ?? []).forEach((s: any) => {
      subjectMap[s.id] = { name: s.name, slug: s.slug };
    });

    subjectSummaries = (summaries ?? []).map((s: any) => ({
      ...s,
      subject_name: subjectMap[s.subject_id]?.name ?? "Unknown",
      subject_slug: subjectMap[s.subject_id]?.slug ?? "",
    }));
  }

  // ── Fetch user rank info ───────────────────────────────────────────────
  const { data: user } = await supabase
    .from("users")
    .select("current_rank_tier, total_points, consecutive_poor_sessions")
    .eq("id", userId)
    .single();

  // ── Check if rank changed this session ────────────────────────────────
  const { data: rankLog } = await supabase
    .from("rank_scores")
    .select("previous_tier, new_tier, demoted")
    .eq("user_id", userId)
    .eq("session_id", id)
    .single();

  // ── Build response ─────────────────────────────────────────────────────
  return NextResponse.json({
    session: {
      id: session.id,
      mode: session.mode,
      variant: session.variant,
      total_questions: session.total_questions,
      correct_count: session.correct_count,
      overall_accuracy_percent: session.overall_accuracy_percent,
      total_time_seconds: session.total_time_seconds,
      overall_avg_time_per_question: session.overall_avg_time_per_question,
      max_streak: session.max_streak,
      base_points: session.base_points,
      bonus_points: session.bonus_points,
      total_points: session.total_points,
      simulation_score: session.simulation_score,
      is_flagged: session.is_flagged,
      auto_submitted: session.auto_submitted,
      started_at: session.started_at,
      submitted_at: session.submitted_at,
      completed_at: session.completed_at,
    },
    attempts: attempts ?? [],
    subject_summaries: subjectSummaries,
rank: {
  current_tier: user?.current_rank_tier ?? "unranked",
  total_points: user?.total_points ?? 0,
  rank_changed: false,
  previous_tier: null,
  new_tier: null,
  demoted: false,
},
  });
}
