// lib/simulation/notifications/adminNotifier.ts

import { SupabaseClient } from "@supabase/supabase-js";

export async function notifyExcessiveResolution(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  resolutionCount: number,
  subjectsAffected: string[]
): Promise<void> {
  const { error } = await supabase.from("admin_notifications").insert({
    type: "excessive_resolution",
    session_id: sessionId,
    user_id: userId,
    payload: { resolutionCount, subjectsAffected },
    resolved: false,
  });

  if (error) console.error("[adminNotifier] notifyExcessiveResolution failed:", error);
}

export async function notifyGenerationFailure(
  supabase: SupabaseClient,
  userId: string,
  diagnostics: any
): Promise<void> {
  const { error } = await supabase.from("admin_notifications").insert({
    type: "generation_failure",
    user_id: userId,
    payload: diagnostics,
    resolved: false,
  });

  if (error) console.error("[adminNotifier] notifyGenerationFailure failed:", error);
}

export async function sendCompensationMessage(
  supabase: SupabaseClient,
  notificationId: string,
  message: string
): Promise<void> {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ compensation_message: message, resolved: true })
    .eq("id", notificationId);

  if (error) throw new Error(`sendCompensationMessage failed: ${error.message}`);
}

export async function getAdminNotifications(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("*")
    .eq("resolved", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getAdminNotifications failed: ${error.message}`);

  return data ?? [];
}

export async function markNotificationResolved(
  supabase: SupabaseClient,
  notificationId: string
): Promise<void> {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ resolved: true })
    .eq("id", notificationId);

  if (error) throw new Error(`markNotificationResolved failed: ${error.message}`);
}
