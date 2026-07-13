// app/api/user/me/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("username, email, daily_streak_count, role, current_rank_tier")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
