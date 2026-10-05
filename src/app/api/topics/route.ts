import { NextResponse } from "next/server"
import { createLegacySupabaseClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const subjectId = searchParams.get("subject_id")

  if (!subjectId) {
    return NextResponse.json(
      { error: "subject_id query parameter is required" },
      { status: 400 }
    )
  }

  const supabase = createLegacySupabaseClient()

  const { data, error } = await supabase
    .from("topics")
    .select(`
      id,
      name,
      slug,
      weight,
      question_count,
      status,
      jamb_frequency,
      section_id,
      sections!inner (
        id,
        name,
        subject_id
      )
    `)
    .eq("sections.subject_id", subjectId)
    .eq("status", "active")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching topics:", error)
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
