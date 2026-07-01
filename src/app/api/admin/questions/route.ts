import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.publicMetadata.role !== "admin") {
    return { error: "Forbidden", status: 403 };
  }

  return { userId };
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request: Request) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
  );
  const subjectId = searchParams.get("subject_id");
  const topicId = searchParams.get("topic_id");

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = getServiceRoleClient();

  let query = supabase
    .from("questions")
    .select("*", { count: "exact" })
    .order("id", { ascending: true })
    .range(from, to);

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }
  if (topicId) {
    query = query.eq("topic_id", topicId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data,
    meta: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

export async function POST(request: Request) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const body = await request.json();

  const requiredFields = [
    "subject_id",
    "topic_id",
    "text",
    "options",
    "correct_option_id",
    "explanation",
  ];
  const missing = requiredFields.filter(
    (field) => body[field] === undefined || body[field] === null
  );

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.options) || body.options.length === 0) {
    return NextResponse.json(
      { error: "options must be a non-empty array" },
      { status: 400 }
    );
  }

  for (const opt of body.options) {
    if (!opt.id || !opt.text) {
      return NextResponse.json(
        { error: "Each option must have an id and text" },
        { status: 400 }
      );
    }
  }

  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("questions")
    .insert({
      subject_id: body.subject_id,
      topic_id: body.topic_id,
      text: body.text,
      options: body.options,
      correct_option_id: body.correct_option_id,
      explanation: body.explanation,
      times_answered: 0,
      times_correct: 0,
      avg_time_seconds: null,
      derived_difficulty: null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
    }
      
