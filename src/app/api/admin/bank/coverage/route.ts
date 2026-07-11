// app/api/admin/bank/coverage/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const MIN_QUESTIONS_PER_TOPIC = 10;

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role === "admin";
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  if (!(await isAdmin(supabase, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: topics, error } = await supabase
    .from("topics")
    .select("id, name, subject_id, question_count")
    .eq("status", "active");

  if (error || !topics) {
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }

  const belowThreshold = topics.filter(
    (t: any) => (t.question_count ?? 0) < MIN_QUESTIONS_PER_TOPIC
  );

  return NextResponse.json({
    total_topics: topics.length,
    below_threshold: belowThreshold.length,
    minimum_required: MIN_QUESTIONS_PER_TOPIC,
    gaps: belowThreshold,
  });
}
