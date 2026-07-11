// app/api/simulation/session/[id]/start/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { startSession } from "@/lib/simulation/session/cbtSessionEngine";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const supabase = getServiceRoleClient();
  const session = await startSession(supabase, id, userId);

  if (!session) {
    return NextResponse.json(
      { error: "Session not found or already started" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    session_id: session.id,
    status: session.status,
    started_at: session.started_at,
    expires_at: session.expires_at,
  });
}
