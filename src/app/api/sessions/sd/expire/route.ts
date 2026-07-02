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

  const { session_id } = body;

  if (!session_id) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
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

  const servedAt = new Date(sd.question_served_at).getTime();
  const elapsedSeconds = (Date.now() - servedAt) / 1000;

  if (elapsedSeconds <= 32) {
    return NextResponse.json({ error: "Session not yet expired" }, { status: 400 });
  }

  const { error: deactivateError } = await supabase
    .from("sd_active_sessions")
    .update({ is_active: false })
    .eq("session_id", session_id);

  if (deactivateError) {
    return NextResponse.json({ error: "Failed to expire session" }, { status: 500 });
  }

  const { error: sessionUpdateError } = await supabase
    .from("sessions")
    .update({
      is_completed: true,
      total_time_seconds: 0,
      correct_count: sd.streak_count,
      max_streak: sd.streak_count,
      total_questions: sd.questions_answered,
      base_points: 0,
      total_points: 0,
      gems_earned: 0,
    })
    .eq("id", session_id);

  if (sessionUpdateError) {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }

  const { data: userData } = await supabase
    .from("users")
    .select("total_sessions_completed")
    .eq("id", userId)
    .single();

  await supabase
    .from("users")
    .update({
      total_sessions_completed: (userData?.total_sessions_completed ?? 0) + 1,
    })
    .eq("id", userId);

  return NextResponse.json({
    expired: true,
    questions_survived: sd.questions_answered,
  });
    }
