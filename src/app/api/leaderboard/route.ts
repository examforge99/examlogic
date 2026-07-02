import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const VALID_TYPES = ["weekly_gems", "top_rank", "best_sudden_death"] as const;
const VALID_SCOPES = ["global", "physics", "chemistry", "maths", "english"] as const;

type LeaderboardType = typeof VALID_TYPES[number];
type LeaderboardScope = typeof VALID_SCOPES[number];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as LeaderboardType;
  const scope = searchParams.get("scope") as LeaderboardScope ?? "global";

  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!VALID_SCOPES.includes(scope)) {
    return NextResponse.json(
      { error: `Invalid scope. Must be one of: ${VALID_SCOPES.join(", ")}` },
      { status: 400 }
    );
  }

  // best_sudden_death is global only
  if (type === "best_sudden_death" && scope !== "global") {
    return NextResponse.json(
      { error: "best_sudden_death leaderboard is global only" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = supabase
    .from("leaderboard_snapshots")
    .select("type, scope, snapshot_data, week_start, generated_at")
    .eq("type", type)
    .eq("scope", scope)
    .order("generated_at", { ascending: false })
    .limit(1);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json({
      type,
      scope,
      entries: [],
      generated_at: null,
      week_start: null,
    });
  }

  const snapshot = data[0];

  return NextResponse.json({
    type,
    scope,
    entries: snapshot.snapshot_data,
    generated_at: snapshot.generated_at,
    week_start: snapshot.week_start ?? null,
  });
}
