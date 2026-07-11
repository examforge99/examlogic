// app/api/admin/templates/refill/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { triggerDifficultyRefill } from "@/lib/simulation/refill/templateRefill";
import { triggerTopicRefill } from "@/lib/simulation/refill/topicTemplateRefill";

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

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();

  if (!(await isAdmin(supabase, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, question_count, subject_id } = body;

  if (type === "difficulty") {
    if (!question_count || ![40, 60].includes(question_count)) {
      return NextResponse.json(
        { error: "question_count must be 40 or 60" },
        { status: 400 }
      );
    }
    await triggerDifficultyRefill(supabase, question_count);
    return NextResponse.json({ success: true, type: "difficulty", question_count });
  }

  if (type === "topic") {
    if (!subject_id) {
      return NextResponse.json({ error: "subject_id is required" }, { status: 400 });
    }
    await triggerTopicRefill(supabase, subject_id);
    return NextResponse.json({ success: true, type: "topic", subject_id });
  }

  return NextResponse.json({ error: "type must be difficulty or topic" }, { status: 400 });
}
