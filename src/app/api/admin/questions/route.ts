// app/api/admin/questions/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/isAdmin";

export async function POST(req: Request) {
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    subject_id,
    topic_id,
    difficulty_level,
    question_text,
    options,
    explanation,
  } = body;

  // Validate required fields
  if (!subject_id || !topic_id || !difficulty_level || !question_text) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!Array.isArray(options) || options.length !== 4) {
    return NextResponse.json({ error: "Exactly 4 options required" }, { status: 400 });
  }

  if (options.some((o: any) => !o.text?.trim())) {
    return NextResponse.json({ error: "All options must have text" }, { status: 400 });
  }

  const correctOptions = options.filter((o: any) => o.isCorrect);
  if (correctOptions.length !== 1) {
    return NextResponse.json({ error: "Exactly one correct option required" }, { status: 400 });
  }

  if (![1, 2, 3, 4, 5].includes(difficulty_level)) {
    return NextResponse.json({ error: "Difficulty level must be 1–5" }, { status: 400 });
  }

  // Pre-generate option UUIDs
  const optionRows = options.map((o: any, i: number) => ({
    id: crypto.randomUUID(),
    option_text: o.text.trim(),
    position: i + 1,
    isCorrect: o.isCorrect,
  }));

  const correctOptionId = optionRows.find((o) => o.isCorrect)!.id;

  // Insert question
  const { data: question, error: qError } = await supabase
    .from("questions")
    .insert({
      subject_id,
      topic_id,
      difficulty_level,
      question_text: question_text.trim(),
      correct_option_id: correctOptionId,
      explanation: explanation?.trim() || null,
      status: "active",
    })
    .select("id")
    .single();

  if (qError || !question) {
    console.error("[admin/questions] Insert question failed:", qError);
    return NextResponse.json(
      { error: qError?.message ?? "Failed to insert question" },
      { status: 500 }
    );
  }

  // Insert options
  const { error: oError } = await supabase
    .from("question_options")
    .insert(
      optionRows.map(({ id, option_text, position }) => ({
        id,
        question_id: question.id,
        option_text,
        position,
      }))
    );

  if (oError) {
    console.error("[admin/questions] Insert options failed:", oError);
    // Rollback question
    await supabase.from("questions").delete().eq("id", question.id);
    return NextResponse.json(
      { error: oError.message },
      { status: 500 }
    );
  }

  // Increment topic question count
  const { error: rpcError } = await supabase.rpc(
    "increment_topic_question_count",
    { p_topic_id: topic_id }
  );

  if (rpcError) {
    console.error("[admin/questions] increment_topic_question_count failed:", rpcError);
  }

  return NextResponse.json({ success: true, question_id: question.id });
    }
