// app/api/campaign/availability/route.ts

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const subjectId = searchParams.get("subject_id")
  const topicIdsRaw = searchParams.get("topic_ids")
  const difficultyRaw = searchParams.get("difficulty_level")
  const difficultyLevel = difficultyRaw ? Number(difficultyRaw) : null

  if (difficultyLevel !== null && (!Number.isInteger(difficultyLevel) || difficultyLevel < 1 || difficultyLevel > 7)) {
    return NextResponse.json({ error: "difficulty_level must be between 1 and 7" }, { status: 400 })
  }

  if (!subjectId || !topicIdsRaw) {
    return NextResponse.json(
      { error: "subject_id and topic_ids are required" },
      { status: 400 }
    )
  }

  const topicIds = topicIdsRaw.split(",").filter(Boolean)
  if (topicIds.length === 0) {
    return NextResponse.json(
      { error: "At least one topic_id required" },
      { status: 400 }
    )
  }

  const supabase = createClient()

  // Validate user is enrolled in this subject
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("jamb_subjects")
    .eq("id", userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (!user.jamb_subjects?.includes(subjectId)) {
    return NextResponse.json(
      { error: "You are not enrolled in this subject" },
      { status: 403 }
    )
  }

  // Validate topics belong to this subject
  const { data: validTopics, error: topicError } = await supabase
    .from("topics")
    .select("id, sections!inner(subject_id)")
    .in("id", topicIds)

  if (topicError) {
    return NextResponse.json(
      { error: "Failed to validate topics" },
      { status: 500 }
    )
  }

  const validTopicIds = new Set(
    (validTopics ?? [])
      .filter(t => (t.sections as any)?.subject_id === subjectId)
      .map(t => t.id)
  )

  // Check availability per topic — excluding cooldown
  const now = new Date().toISOString()

  const results = await Promise.all(
    topicIds.map(async (topicId) => {
      if (!validTopicIds.has(topicId)) {
        return {
          topic_id: topicId,
          available_count: 0,
          has_questions: false,
          valid: false
        }
      }

      // Total active questions in topic
      let totalQuery = supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("topic_id", topicId)
        .eq("is_active", true)
      if (difficultyLevel !== null) totalQuery = totalQuery.eq("setter_difficulty", difficultyLevel)
      const { count: total } = await totalQuery

      // Questions currently under cooldown for this user
      let cooldownQuery = supabase
        .from("questions")
        .select("id, user_question_seen!inner(next_eligible_at)", {
          count: "exact",
          head: true
        })
        .eq("topic_id", topicId)
        .eq("is_active", true)
        .eq("user_question_seen.user_id", userId)
        .gt("user_question_seen.next_eligible_at", now)
      if (difficultyLevel !== null) cooldownQuery = cooldownQuery.eq("setter_difficulty", difficultyLevel)
      const { count: onCooldown } = await cooldownQuery

      const totalCount = total ?? 0
      const cooldownCount = onCooldown ?? 0
      const available = Math.max(0, totalCount - cooldownCount)

      return {
        topic_id: topicId,
        total_count: totalCount,
        available_count: available,
        capped_at: Math.min(available, 50),
        has_questions: available > 0,
        valid: true
      }
    })
  )

  return NextResponse.json({ availability: results })
}
