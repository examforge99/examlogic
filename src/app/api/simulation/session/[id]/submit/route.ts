// app/api/simulation/session/[id]/submit/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { submitSession } from "@/lib/simulation/session/answerBuffer";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { answers } = body;

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Missing answers payload" }, { status: 400 });
  }

  const supabase = getServiceRoleClient();
  const result = await submitSession(supabase, id, userId, answers);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
