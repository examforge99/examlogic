// app/api/simulation/session/[id]/result/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionResult } from "@/lib/simulation/session/cbtSessionEngine";

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();
  const result = await getSessionResult(supabase, params.id, userId);

  if (!result) {
    return NextResponse.json(
      { error: "Result not available yet" },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
