// app/api/simulation/start/route.ts

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runSimulationPipeline } from "@/lib/simulation/orchestrator";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSimulationPipeline(userId);

  return NextResponse.json(
    result.error ? { error: result.error } : { data: result.data },
    { status: result.status }
  );
}
