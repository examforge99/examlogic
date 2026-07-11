// app/api/admin/notifications/[id]/respond/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { sendCompensationMessage } from "@/lib/simulation/notifications/adminNotifier";

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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  const { message } = body;
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  await sendCompensationMessage(supabase, params.id, message);
  return NextResponse.json({ success: true });
}
