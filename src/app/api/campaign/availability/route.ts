// app/api/campaign/availability/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase service role configuration");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subject_id");
  const topicIdsRaw = searchParams.get("topic_ids");
  const difficultyLevel = parseInt(searchParams.get("difficulty_level") ?? "0");

  if (!subjectId || !topicIdsRaw || !difficultyLevel) {
    return NextResponse.json(
      { error: "subject_id, topic_ids, and difficulty_level are required" },
      { status: 400 }
    );
  }

  if (difficultyLevel < 1 || difficultyLevel > 7) {
    return NextResponse.json(
      { error: "difficulty_level must be between 1 and 7" },
      { status: 400 }
    );
  }

  const topicIds = topicIdsRaw.split(",").filter(Boolean);
  if (!topicIds.length) {
    return NextResponse.json(
      { error: "At least one topic_id required" },
      { status: 400 }
    );
  }

  const supabase = getServiceRoleClient();

  // Validate user owns this subject
  const { data: user } = await supabase
    .from("users")
    .select("jamb_subjects")
    .eq("id", userId)
    .single();

  if (!user?.jamb_subjects?.includes(subjectId)) {
    // Check English separately
    const { data: englishSubject } = await supabase
      .from("subjects")
      .select("id")
      .eq("slug", "english")
      .single();

    if (englishSubject?.id !== subjectId) {
      return NextResponse.json(
        { error: "You are not enrolled in this subject" },
        { status: 403 }
      );
    }
  }

  // Check availability per topic
  const results = await Promise.all(
    topicIds.map(async (topicId) => {
      const { count } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("subject_id", subjectId)
        .eq("topic_id", topicId)
        .eq("difficulty_level", difficultyLevel)
        .eq("status", "active");

      const available = count ?? 0;

      return {
        topic_id: topicId,
        available_count: available,
        capped_at: Math.min(available, 30),
        has_questions: available > 0,
      };
    })
  );

  return NextResponse.json({ availability: results });
}
