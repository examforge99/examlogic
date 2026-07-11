// app/api/admin/topics/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/isAdmin";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getServiceRoleClient();
  if (!(await isAdmin(supabase, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const subject_id = searchParams.get("subject_id");

  if (!subject_id) return NextResponse.json({ error: "subject_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("topics")
    .select("id, name")
    .eq("subject_id", subject_id)
    .eq("status", "active")
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ topics: data ?? [] });
}
