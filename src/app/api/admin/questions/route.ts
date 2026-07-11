// app/api/admin/questions/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/isAdmin";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  if (!(await isAdmin(supabase, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { subject_id, topic_id, difficulty_level, question_text, option_a, option_b, option_c, option_d, correct_option_id, explanation } = body;

  if (!subject_id || !topic_id || !difficulty_level || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_option_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error: qError } = await supabase.from("questions").insert({
    subject_id,
    topic_id,
    difficulty_level,
    question_text,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option_id,
    explanation: explanation || null,
    status: "active",
  });

  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });

  // Increment topic question count
  await supabase.rpc("increment_topic_question_count", { p_topic_id: topic_id });

  return NextResponse.json({ success: true });
}
