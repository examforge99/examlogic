// app/api/admin/notifications/[id]/respond/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/isAdmin";
import { sendCompensationMessage } from "@/lib/simulation/notifications/adminNotifier";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
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

  const { message } = body;
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  await sendCompensationMessage(supabase, id, message);
  return NextResponse.json({ success: true });
}
