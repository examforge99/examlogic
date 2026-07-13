// app/api/leaderboard/preview/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  // Top 5 by total points
  const { data: top, error } = await supabase
    .from("users")
    .select("id, username, total_points, current_rank_tier")
    .order("total_points", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Current user rank
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, username, total_points, current_rank_tier")
    .order("total_points", { ascending: false });

  const currentUserIndex = (allUsers ?? []).findIndex((u: any) => u.id === userId);
  const currentUser = currentUserIndex !== -1 ? allUsers![currentUserIndex] : null;

  const topWithMeta = (top ?? []).map((u: any, i: number) => ({
    rank: i + 1,
    user_id: u.id,
    username: u.username ?? "Anonymous",
    total_points: u.total_points ?? 0,
    current_rank_tier: u.current_rank_tier ?? "unranked",
    is_current_user: u.id === userId,
  }));

  const currentUserEntry = currentUser
    ? {
        rank: currentUserIndex + 1,
        user_id: currentUser.id,
        username: currentUser.username ?? "Anonymous",
        total_points: currentUser.total_points ?? 0,
        current_rank_tier: currentUser.current_rank_tier ?? "unranked",
        is_current_user: true,
      }
    : null;

  return NextResponse.json({
    top: topWithMeta,
    currentUser: currentUserEntry,
  });
}
