import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Admin check
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (userError || !user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekStartIso = weekStart.toISOString().split("T")[0];

  const scopes = ["global", "physics", "chemistry", "maths", "english"] as const;
  const errors: string[] = [];

  // ── Weekly Gems (global + subject scoped) ─────────────────────────────
  for (const scope of scopes) {
    let gemsQuery = supabase
      .from("currency_transactions")
      .select("user_id, amount, users(username, avatar_url)")
      .eq("type", "session_earn")
      .gte("created_at", `${weekStartIso}T00:00:00Z`);

    // For subject scoped — filter by sessions that involved that subject
    // For v1 global only is fully accurate, subject scoped is approximated
    // via session_subject_summaries
    if (scope !== "global") {
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("id")
        .eq("slug", scope)
        .single();

      if (subjectData) {
        const { data: sessionIds } = await supabase
          .from("session_subject_summaries")
          .select("session_id")
          .eq("subject_id", subjectData.id)
          .gte("created_at", `${weekStartIso}T00:00:00Z`);

        if (sessionIds && sessionIds.length > 0) {
          const ids = sessionIds.map((s: any) => s.session_id);
          gemsQuery = gemsQuery.in(
            "reference_id",
            ids
          );
        } else {
          // No sessions for this subject this week
          await supabase.from("leaderboard_snapshots").upsert({
            type: "weekly_gems",
            scope,
            snapshot_data: [],
            week_start: weekStartIso,
            generated_at: now,
          }, { onConflict: "type,scope" });
          continue;
        }
      }
    }

    const { data: transactions, error: txError } = await gemsQuery;

    if (txError) {
      errors.push(`weekly_gems ${scope}: ${txError.message}`);
      continue;
    }

    // Aggregate gems per user
    const gemsMap = new Map<string, { username: string; avatar_url: string; total_gems: number }>();
    for (const tx of transactions ?? []) {
      const existing = gemsMap.get(tx.user_id);
      const username = (tx.users as any)?.username ?? "Unknown";
      const avatar_url = (tx.users as any)?.avatar_url ?? null;
      if (existing) {
        existing.total_gems += tx.amount;
      } else {
        gemsMap.set(tx.user_id, { username, avatar_url, total_gems: tx.amount });
      }
    }

    const entries = Array.from(gemsMap.entries())
      .map(([user_id, data]) => ({ user_id, ...data }))
      .sort((a, b) => b.total_gems - a.total_gems)
      .slice(0, 100)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    const { error: upsertError } = await supabase
      .from("leaderboard_snapshots")
      .upsert({
        type: "weekly_gems",
        scope,
        snapshot_data: entries,
        week_start: weekStartIso,
        generated_at: now,
      }, { onConflict: "type,scope" });

    if (upsertError) errors.push(`weekly_gems ${scope} upsert: ${upsertError.message}`);
  }

  // ── Top Rank (global + subject scoped) ────────────────────────────────
  for (const scope of scopes) {
    let rankQuery = supabase
      .from("rank_scores")
      .select("user_id, composite_score, tier, users(username, avatar_url)")
      .neq("tier", "unranked")
      .order("composite_score", { ascending: false })
      .limit(100);

    if (scope !== "global") {
      const { data: subjectData } = await supabase
        .from("subjects")
        .select("id")
        .eq("slug", scope)
        .single();

      if (subjectData) {
        const { data: topUserIds } = await supabase
          .from("session_subject_summaries")
          .select("user_id")
          .eq("subject_id", subjectData.id);

        if (topUserIds && topUserIds.length > 0) {
          const ids = [...new Set(topUserIds.map((u: any) => u.user_id))];
          rankQuery = rankQuery.in("user_id", ids);
        } else {
          await supabase.from("leaderboard_snapshots").upsert({
            type: "top_rank",
            scope,
            snapshot_data: [],
            generated_at: now,
          }, { onConflict: "type,scope" });
          continue;
        }
      }
    }

    const { data: rankData, error: rankError } = await rankQuery;

    if (rankError) {
      errors.push(`top_rank ${scope}: ${rankError.message}`);
      continue;
    }

    const entries = (rankData ?? []).map((row: any, index: number) => ({
      rank: index + 1,
      user_id: row.user_id,
      username: row.users?.username ?? "Unknown",
      avatar_url: row.users?.avatar_url ?? null,
      composite_score: row.composite_score,
      tier: row.tier,
    }));

    const { error: upsertError } = await supabase
      .from("leaderboard_snapshots")
      .upsert({
        type: "top_rank",
        scope,
        snapshot_data: entries,
        generated_at: now,
      }, { onConflict: "type,scope" });

    if (upsertError) errors.push(`top_rank ${scope} upsert: ${upsertError.message}`);
  }

  // ── Best Sudden Death (global only) ───────────────────────────────────
  const { data: sdData, error: sdError } = await supabase
    .from("sudden_death_records")
    .select("user_id, questions_survived, achieved_at, users(username, avatar_url)")
    .order("questions_survived", { ascending: false })
    .limit(100);

  if (sdError) {
    errors.push(`best_sudden_death: ${sdError.message}`);
  } else {
    const sdEntries = (sdData ?? []).map((row: any, index: number) => ({
      rank: index + 1,
      user_id: row.user_id,
      username: row.users?.username ?? "Unknown",
      avatar_url: row.users?.avatar_url ?? null,
      questions_survived: row.questions_survived,
      achieved_at: row.achieved_at,
    }));

    const { error: sdUpsertError } = await supabase
      .from("leaderboard_snapshots")
      .upsert({
        type: "best_sudden_death",
        scope: "global",
        snapshot_data: sdEntries,
        generated_at: now,
      }, { onConflict: "type,scope" });

    if (sdUpsertError) errors.push(`best_sudden_death upsert: ${sdUpsertError.message}`);
  }

  return NextResponse.json({
    success: errors.length === 0,
    refreshed_at: now,
    errors: errors.length > 0 ? errors : undefined,
  });
            }
