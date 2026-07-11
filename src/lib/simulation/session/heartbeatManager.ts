// lib/simulation/session/heartbeatManager.ts

import { SupabaseClient } from "@supabase/supabase-js";

const HEARTBEAT_INTERVAL_SECONDS = 30;
const MAX_STRIKES = 3;
const STRIKE_WINDOW_SECONDS = 90; // 3 missed heartbeats × 30s

export interface HeartbeatResponse {
  status: "ok" | "warning" | "terminated";
  strikes: number;
  message?: string;
}

export async function processHeartbeat(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<HeartbeatResponse> {
  // Fetch current session state
  const { data: session, error } = await supabase
    .from("exam_sessions")
    .select("id, status, missed_heartbeats, expires_at, user_id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error || !session) {
    return { status: "terminated", strikes: 0, message: "Session not found" };
  }

  if (session.status !== "active") {
    return { status: "terminated", strikes: 0, message: "Session is not active" };
  }

  // Check if session has expired
  if (new Date(session.expires_at) < new Date()) {
    await terminateSession(supabase, sessionId);
    return { status: "terminated", strikes: 0, message: "Session expired" };
  }

  // Valid heartbeat — reset strikes
  await resetMissedHeartbeats(supabase, sessionId);

  return buildHeartbeatResponse(0);
}

export async function incrementMissedHeartbeats(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("exam_sessions")
    .select("missed_heartbeats, status")
    .eq("id", sessionId)
    .single();

  if (error || !data || data.status !== "active") return 0;

  const newCount = (data.missed_heartbeats ?? 0) + 1;

  await supabase
    .from("exam_sessions")
    .update({ missed_heartbeats: newCount })
    .eq("id", sessionId);

  return newCount;
}

export async function resetMissedHeartbeats(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  await supabase
    .from("exam_sessions")
    .update({ missed_heartbeats: 0 })
    .eq("id", sessionId);
}

export async function checkStrikeCount(
  supabase: SupabaseClient,
  sessionId: string
): Promise<HeartbeatResponse> {
  const strikes = await incrementMissedHeartbeats(supabase, sessionId);

  if (strikes >= MAX_STRIKES) {
    await terminateSession(supabase, sessionId);
    return {
      status: "terminated",
      strikes,
      message: "Session terminated due to inactivity",
    };
  }

  return buildHeartbeatResponse(strikes);
}

export async function terminateSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  // Auto-submit before terminating
  await autoSubmitSession(supabase, sessionId);

  await supabase
    .from("exam_sessions")
    .update({ status: "terminated" })
    .eq("id", sessionId);
}

export function buildHeartbeatResponse(strikes: number): HeartbeatResponse {
  if (strikes === 0) {
    return { status: "ok", strikes: 0 };
  }

  if (strikes === 1) {
    return {
      status: "warning",
      strikes: 1,
      message: "Connection issue detected. Please stay on the page.",
    };
  }

  if (strikes === 2) {
    return {
      status: "warning",
      strikes: 2,
      message: "Final warning. Your session will be submitted if connection is lost.",
    };
  }

  return {
    status: "terminated",
    strikes,
    message: "Session terminated due to inactivity",
  };
}

async function autoSubmitSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  // Mark all unanswered questions — they stay null, scoring treats null as wrong
  await supabase
    .from("exam_sessions")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      auto_submitted: true,
    })
    .eq("id", sessionId);
}
