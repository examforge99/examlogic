// lib/simulation/engines/templateEngine.ts

import { SupabaseClient } from "@supabase/supabase-js";

export async function selectDifficultyTemplates(
  supabase: SupabaseClient,
  userId: string,
  questionCounts: (40 | 60)[]
) {
  // Fetch user's consumed template ids
  const { data: history } = await supabase
    .from("user_template_history")
    .select("template_id")
    .eq("user_id", userId);

  const usedIds = (history ?? []).map((r: any) => r.template_id);

  const templates = [];

  for (const count of questionCounts) {
    let query = supabase
      .from("simulation_templates")
      .select("*")
      .eq("question_count", count)
      .eq("status", "available")
      .order("id", { ascending: true })
      .limit(1);

    if (usedIds.length > 0) {
      query = query.not("id", "in", `(${usedIds.join(",")})`);
    }

    const { data, error } = await query.single();

    if (error || !data) return null; // caller handles failure

    templates.push(data);
    usedIds.push(data.id); // exclude from next iteration
  }

  return templates;
}

export async function markTemplatesUsed(
  supabase: SupabaseClient,
  userId: string,
  templateIds: number[],
  sessionId: string
) {
  const rows = templateIds.map((templateId) => ({
    user_id: userId,
    template_id: templateId,
    session_id: sessionId,
  }));

  const { error } = await supabase.from("user_template_history").insert(rows);

  if (error) throw new Error(`markTemplatesUsed failed: ${error.message}`);
}

export async function checkDifficultyRefillThreshold(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("simulation_templates")
    .select("question_count, status");

  if (error || !data) return;

  const counts = { available40: 0, total40: 0, available60: 0, total60: 0 };

  for (const row of data) {
    if (row.question_count === 40) {
      counts.total40++;
      if (row.status === "available") counts.available40++;
    } else if (row.question_count === 60) {
      counts.total60++;
      if (row.status === "available") counts.available60++;
    }
  }

  const needs40 = counts.total40 === 0 || counts.available40 / counts.total40 < 0.3;
  const needs60 = counts.total60 === 0 || counts.available60 / counts.total60 < 0.3;

  // Return flags — orchestrator decides what to do
  return { needs40Refill: needs40, needs60Refill: needs60 };
  }
