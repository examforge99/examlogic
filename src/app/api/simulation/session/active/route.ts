import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("[simulation/session/active] Missing Supabase configuration");
    return NextResponse.json({ error: "Session service is unavailable" }, { status: 503 });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: session, error } = await supabase
    .from("exam_sessions")
    .select("id, mode, status, started_at, expires_at")
    .eq("user_id", userId)
    .eq("mode", "simulation")
    .in("status", ["pending", "active"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[simulation/session/active] Query failed:", error.message);
    return NextResponse.json({ error: "Could not check for an active simulation" }, { status: 500 });
  }

  return NextResponse.json({ session: session ?? null });
}
