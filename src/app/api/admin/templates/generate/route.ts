import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { triggerDifficultyRefill } from "@/lib/simulation/refill/templateRefill"

function getServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()
  return data?.role === "admin"
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = getServiceRoleClient()

  if (!(await isAdmin(supabase, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const { force } = body

  if (force) {
    const { error: deleteError } = await supabase
      .from("simulation_templates")
      .delete()
      .neq("id", 0)

    if (deleteError) {
      return NextResponse.json(
        { error: `Failed to clear templates: ${deleteError.message}` },
        { status: 500 }
      )
    }
  }

  const report40 = await triggerDifficultyRefill(supabase, 40)
  const report60 = await triggerDifficultyRefill(supabase, 60)

  return NextResponse.json({
    success: true,
    regenerated: !!force,
    reports: [report40, report60]
  })
}
