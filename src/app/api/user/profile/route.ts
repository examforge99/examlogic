import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Fetch user profile
  const { data: user, error: userError } = await supabase
    .from("users")
    .select(
      "id, username, email, avatar_url, daily_streak_count, total_sessions_completed, jamb_subjects, current_rank_tier, current_difficulty_band, last_active_date"
    )
    .eq("id", userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch rank scores
  const { data: rankScores } = await supabase
    .from("rank_scores")
    .select(
      "accuracy_score, speed_score, consistency_score, depth_score, composite_score, tier, sessions_counted, last_calculated_at"
    )
    .eq("user_id", userId)
    .single();

  // Fetch sudden death personal best
  const { data: suddenDeathRecord } = await supabase
    .from("sudden_death_records")
    .select("questions_survived, achieved_at")
    .eq("user_id", userId)
    .single();

  // Fetch equipped cosmetics
  const { data: equippedCosmetics } = await supabase
    .from("user_cosmetics")
    .select("cosmetic_id, cosmetics(name, type, image_url)")
    .eq("user_id", userId)
    .eq("is_equipped", true);

  // Fetch jamb subject details
  const { data: subjectDetails } = await supabase
    .from("subjects")
    .select("id, name, slug")
    .in("id", user.jamb_subjects ?? []);

  return NextResponse.json({
    profile: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar_url: user.avatar_url,
      daily_streak_count: user.daily_streak_count,
      total_sessions_completed: user.total_sessions_completed,
      last_active_date: user.last_active_date,
      current_rank_tier: user.current_rank_tier,
      current_difficulty_band: user.current_difficulty_band,
      jamb_subjects: subjectDetails ?? [],
    },
    rank: rankScores ?? null,
    sudden_death_best: suddenDeathRecord ?? null,
    equipped_cosmetics: equippedCosmetics ?? [],
  });
    }

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let body: { username?: string; avatar_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const allowedFields = ["username", "avatar_url"];
  const safeUpdate = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.keys(safeUpdate).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  // Check username uniqueness if updating username
  if (safeUpdate.username) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("username", safeUpdate.username)
      .neq("id", userId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update(safeUpdate)
    .eq("id", userId)
    .select("id, username, avatar_url")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, profile: data });
}
