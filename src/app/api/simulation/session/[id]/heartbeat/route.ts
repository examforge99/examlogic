// app/api/simulation/session/[id]/heartbeat/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { processHeartbeat } from "@/lib/simulation/session/heartbeatManager";

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
  const response = await processHeartbeat(supabase, id, userId);

  return NextResponse.json(response);
}
