// lib/simulation/engines/topicTemplateEngine.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { generateComboFingerprint, checkFingerprintExists, storeFingerprintRecord } from "@/lib/simulation/helpers/fingerprintGenerator";

export async function selectTopicTemplates(
  supabase: SupabaseClient,
  userId: string,
  subjectIds: string[]
) {
  const { data: history } = await supabase
    .from("user_topic_template_history")
    .select("template_id")
    .eq("user_id", userId);

  const usedIds = (history ?? []).map((r: any) => r.template_id);
  const selected = [];

  for (const subjectId of subjectIds) {
    let query = supabase
      .from("subject_topic_templates")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("status", "available")
      .order("id", { ascending: true })
      .limit(1);

    if (usedIds.length > 0) {
      query = query.not("id", "in", `(${usedIds.join(",")})`);
    }

    const { data, error } = await query.single();

    if (error || !data) return null; // caller handles failure

    selected.push(data);
    usedIds.push(data.id);
  }

  return selected;
}

export async function markTopicTemplatesUsed(
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

  const { error } = await supabase
    .from("user_topic_template_history")
    .insert(rows);

  if (error) throw new Error(`markTopicTemplatesUsed failed: ${error.message}`);
}

export async function checkTopicRefillThreshold(
  supabase: SupabaseClient,
  subjectIds: string[]
) {
  const { data, error } = await supabase
    .from("subject_topic_templates")
    .select("subject_id, status")
    .in("subject_id", subjectIds);

  if (error || !data) return null;

  const result: Record<string, { needsRefill: boolean }> = {};

  for (const subjectId of subjectIds) {
    const rows = data.filter((r: any) => r.subject_id === subjectId);
    const total = rows.length;
    const available = rows.filter((r: any) => r.status === "available").length;

    result[subjectId] = {
      needsRefill: total === 0 || available / total < 0.3,
    };
  }

  return result;
}

export async function storeSessionFingerprints(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  topicTemplates: { subject_id: string; topic_ids: string[] }[]
) {
  for (const template of topicTemplates) {
    const fingerprint = generateComboFingerprint(template.topic_ids);
    await storeFingerprintRecord(
      supabase,
      userId,
      sessionId,
      template.subject_id,
      template.topic_ids,
      fingerprint
    );
  }
}
