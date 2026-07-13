// app/api/simulation/session/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getSessionById } from "@/lib/simulation/session/cbtSessionEngine";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = getServiceRoleClient();
  const result = await getSessionById(supabase, id, userId);

  if (!result) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
