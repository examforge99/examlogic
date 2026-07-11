// app/api/simulation/session/[id]/result/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { getSessionResult } from "@/lib/simulation/session/cbtSessionEngine";

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
  const result = await getSessionResult(supabase, id, userId);

  if (!result) {
    return NextResponse.json(
      { error: "Result not available yet" },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
