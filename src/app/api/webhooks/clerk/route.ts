import { headers } from "next/headers";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const headersList = await headers();

  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new NextResponse("Missing CLERK_WEBHOOK_SECRET", { status: 400 });
  }

  let evt: any;
  try {
    const wh = new Webhook(webhookSecret);
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, username, image_url } = evt.data;

    const email = email_addresses?.[0]?.email_address ?? null;
    const fallbackUsername = email ? email.split("@")[0] : null;
    const finalUsername = username || fallbackUsername;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new NextResponse("Missing Supabase environment variables", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error } = await supabase.from("users").insert({
      id,
      email,
      username: finalUsername,
      avatar_url: image_url ?? null,
      created_at: new Date().toISOString(),
      daily_streak_count: 0,
      total_sessions_completed: 0,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return new NextResponse("Failed to insert user", { status: 500 });
    }
  }

  return new NextResponse("OK", { status: 200 });
  }

