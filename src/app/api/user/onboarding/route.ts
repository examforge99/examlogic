import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let body: { jamb_subjects: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { jamb_subjects } = body;

  if (!Array.isArray(jamb_subjects) || jamb_subjects.length !== 3) {
    return NextResponse.json(
      { error: "Please select exactly 3 subjects" },
      { status: 400 }
    );
  }

  // Fetch English subject ID
  const { data: englishSubject } = await supabase
    .from("subjects")
    .select("id")
    .eq("slug", "english")
    .single();

  if (!englishSubject) {
    return NextResponse.json(
      { error: "English subject not found" },
      { status: 500 }
    );
  }

  // Validate none of the 3 subjects is English
  if (jamb_subjects.includes(englishSubject.id)) {
    return NextResponse.json(
      { error: "English is already included automatically — do not select it manually" },
      { status: 400 }
    );
  }

  // Validate all 3 subject IDs exist in subjects table
  const { data: validSubjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id")
    .in("id", jamb_subjects);

  if (subjectsError) {
    return NextResponse.json(
      { error: "Failed to validate subjects" },
      { status: 500 }
    );
  }

  if (!validSubjects || validSubjects.length !== 3) {
    return NextResponse.json(
      { error: "One or more selected subjects are invalid" },
      { status: 400 }
    );
  }

  // Update user's jamb_subjects
  const { error: updateError } = await supabase
    .from("users")
    .update({
      jamb_subjects,
      current_rank_tier: "unranked",
      current_difficulty_band: 1,
    })
    .eq("id", userId);

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to save subject selection" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    jamb_subjects,
  });
        }
