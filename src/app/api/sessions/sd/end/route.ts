import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

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

  const { session_id, total_time_seconds } = body;

  if (!session_id) {
    return NextResponse.json(
      { error: "session_id is required" },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();

  // Fetch active SD session
  const { data: sd, error: sdError } = await supabase
    .from("sd_active_sessions")
    .select("*")
    .eq("session_id", session_id)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (sdError || !sd) {
    return NextResponse.json(
      { error: "Active session not found" },
      { status: 404 }
    );
  }

  // Deactivate SD session
  await supabase
    .from("sd_active_sessions")
    .update({ is_active: false })
    .eq("session_id", session_id);

  // Update session as abandoned
  await supabase
    .from("sessions")
    .update({
      is_completed: true,
      total_time_seconds: total_time_seconds ?? 0,
      correct_count: sd.streak_count,
      max_streak: sd.streak_count,
      total_questions: sd.questions_answered,
      base_points: 0,
      total_points: 0,
      gems_earned: 0,
    })
    .eq("id", session_id);

  // Increment total_sessions_completed, NO daily streak update
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
    questions_survived: sd.questions_answered,
    session_ended: true,
  });
          }

