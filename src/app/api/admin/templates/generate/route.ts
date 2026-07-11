// app/api/admin/templates/generate/route.ts

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

  const { subject_ids } = body;

  // Generate all difficulty templates
  await triggerDifficultyRefill(supabase, 40);
  await triggerDifficultyRefill(supabase, 60);

  // Generate topic templates per subject
  if (Array.isArray(subject_ids) && subject_ids.length > 0) {
    for (const subjectId of subject_ids) {
      await triggerTopicRefill(supabase, subjectId);
    }
  }

  return NextResponse.json({ success: true });
}
