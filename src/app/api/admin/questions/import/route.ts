import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

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

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }

  const supabase = getServiceRoleClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  if (user.role !== "admin") {
    return { error: "Forbidden", status: 403 };
  }

  return { userId };
}

interface QuestionInput {
  subject_id: string;
  topic_id: string;
  text: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
  explanation: string;
}

export async function POST(request: Request) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  let questions: QuestionInput[];
  try {
    questions = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!Array.isArray(questions)) {
    return NextResponse.json(
      { error: "Body must be an array of questions" },
      { status: 400 }
    );
  }

  const requiredFields: (keyof QuestionInput)[] = [
    "subject_id",
    "topic_id",
    "text",
    "options",
    "correct_option_id",
    "explanation",
  ];

  const validQuestions: any[] = [];
  const failed: { index: number; reason: string }[] = [];

  questions.forEach((q, index) => {
    const missing = requiredFields.filter(
      (field) => q[field] === undefined || q[field] === null
    );
    if (missing.length > 0) {
      failed.push({
        index,
        reason: `Missing required fields: ${missing.join(", ")}`,
      });
      return;
    }

    if (!Array.isArray(q.options) || q.options.length === 0) {
      failed.push({
        index,
        reason: "options must be a non-empty array",
      });
      return;
    }

    for (const opt of q.options) {
      if (!opt.id || !opt.text) {
        failed.push({
          index,
          reason: "Each option must have an id and text",
        });
        return;
      }
    }

    validQuestions.push({
      subject_id: q.subject_id,
      topic_id: q.topic_id,
      text: q.text,
      options: q.options,
      correct_option_id: q.correct_option_id,
      explanation: q.explanation,
      times_answered: 0,
      times_correct: 0,
      avg_time_seconds: null,
      derived_difficulty: null,
      is_active: true,
    });
  });

  if (validQuestions.length === 0) {
    return NextResponse.json({
      succeeded: 0,
      failed: failed.length,
      failures: failed,
    });
  }

  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("questions")
    .insert(validQuestions)
    .select();

  if (error) {
    console.error("Bulk insert error:", error);
    return NextResponse.json(
      { error: "Failed to import questions", details: error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    succeeded: data?.length ?? validQuestions.length,
    failed: failed.length,
    failures: failed,
  });
       }

