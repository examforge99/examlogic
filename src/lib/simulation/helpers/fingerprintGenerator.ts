// lib/simulation/helpers/fingerprintGenerator.ts

import { SupabaseClient } from "@supabase/supabase-js";

export function generateComboFingerprint(topicIds: string[]): string {
  return topicIds.slice().sort().join("-");
}

export async function checkFingerprintExists(
  supabase: SupabaseClient,
  userId: string,
  fingerprint: string,
  subjectId: string
): Promise<boolean> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("session_fingerprints")
    .select("id")
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .eq("fingerprint", fingerprint)
    .gte("created_at", sevenDaysAgo)
    .limit(1);

  if (error) return false;

  return (data ?? []).length > 0;
}

export async function storeFingerprintRecord(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
  subjectId: string,
  topicIds: string[],
  fingerprint: string
): Promise<void> {
  const { error } = await supabase.from("session_fingerprints").insert({
    user_id: userId,
    session_id: sessionId,
    subject_id: subjectId,
    topic_ids: topicIds,
    fingerprint,
  });

  if (error) throw new Error(`storeFingerprintRecord failed: ${error.message}`);
}
