// lib/simulation/orchestrator.ts

import { createClient } from "@supabase/supabase-js";
import { selectDifficultyTemplates, markTemplatesUsed, checkDifficultyRefillThreshold } from "@/lib/simulation/engines/templateEngine";
import { selectTopicTemplates, markTopicTemplatesUsed, checkTopicRefillThreshold, storeSessionFingerprints } from "@/lib/simulation/engines/topicTemplateEngine";
import { allocateTopicDifficulty } from "@/lib/simulation/engines/topicDifficultyAllocator";
import { retrieveCandidates } from "@/lib/simulation/pipelines/questionRetrieval";
import { scoreCandidates } from "@/lib/simulation/pipelines/candidateScoring";
import { resolveConstraints } from "@/lib/simulation/pipelines/constraintResolution";
import { validateSession } from "@/lib/simulation/pipelines/sessionValidation";
import { createCBTSession } from "@/lib/simulation/session/cbtSessionEngine";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Missing Supabase service role configuration");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function runSimulationPipeline(userId: string) {
  const supabase = getServiceRoleClient();

  // ── 1. Fetch user subject combo ──────────────────────────────────────────
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("jamb_subjects")
    .eq("id", userId)
    .single();

  if (userError || !user?.jamb_subjects?.length) {
    return { error: "User subjects not found", status: 400 };
  }

  const { data: englishSubject } = await supabase
    .from("subjects")
    .select("id")
    .eq("slug", "english")
    .single();

  if (!englishSubject) return { error: "English subject not found", status: 500 };

  const englishSubjectId = englishSubject.id;
  const otherSubjectIds: string[] = user.jamb_subjects.filter(
    (id: string) => id !== englishSubjectId
  );
  const allSubjectIds = [englishSubjectId, ...otherSubjectIds];

  // ── 2. Select difficulty templates ───────────────────────────────────────
  // English = 60q, others = 40q each
  const questionCounts: (40 | 60)[] = [60, ...otherSubjectIds.map(() => 40 as 40)];

  const difficultyTemplates = await selectDifficultyTemplates(supabase, userId, questionCounts);
  if (!difficultyTemplates) {
    return { error: "No difficulty templates available", status: 503 };
  }

  // ── 3. Select topic templates ────────────────────────────────────────────
  const topicTemplates = await selectTopicTemplates(supabase, userId, allSubjectIds);
  if (!topicTemplates) {
    return { error: "No topic templates available", status: 503 };
  }

  // ── 4. Allocate topic difficulty ─────────────────────────────────────────
  const blueprints = [];

  for (let i = 0; i < allSubjectIds.length; i++) {
    try {
      const blueprint = await allocateTopicDifficulty(
        difficultyTemplates[i],
        topicTemplates[i],
        allSubjectIds[i]
      );
      blueprints.push(blueprint);
    } catch (err: any) {
      return { error: `Blueprint allocation failed: ${err.message}`, status: 500 };
    }
  }

  // ── 5. Retrieve question candidates ──────────────────────────────────────
  const rawPool = await retrieveCandidates(supabase, blueprints);

  // ── 6. Score candidates ──────────────────────────────────────────────────
  const scoredPool = await scoreCandidates(supabase, rawPool, userId);

  // ── 7. Resolve constraints ───────────────────────────────────────────────
  const resolvedPool = await resolveConstraints(supabase, userId, scoredPool, blueprints);

  if (resolvedPool.diagnostics.hardStop) {
    return { error: "Session generation failed. Our team has been notified.", status: 503 };
  }

  // ── 8. Validate session ──────────────────────────────────────────────────
  // Temp session id for notification — real id assigned in step 9
  const tempSessionId = crypto.randomUUID();
  const validationReport = await validateSession(
    supabase,
    userId,
    tempSessionId,
    resolvedPool,
    blueprints
  );

  if (!validationReport.passed) {
    return { error: "Session failed validation", status: 500 };
  }

  // ── 9. Create CBT session ────────────────────────────────────────────────
  const difficultyTemplateIds = difficultyTemplates.map((t: any) => t.id);
  const topicTemplateIds = topicTemplates.map((t: any) => t.id);

  const session = await createCBTSession(
  supabase,
  userId,
  resolvedPool,
  validationReport,
  difficultyTemplateIds,
  topicTemplateIds
);

if (!session) {
  return { error: "Failed to create session", status: 500 };
}

// ── 10. Mark templates used + store fingerprints ──
await markTemplatesUsed(supabase, userId, difficultyTemplateIds, session.session_id);
await markTopicTemplatesUsed(supabase, userId, topicTemplateIds, session.session_id);
await storeSessionFingerprints(
  supabase,
  userId,
  session.session_id,
  topicTemplates.map((t: any) => ({ subject_id: t.subject_id, topic_ids: t.topic_ids }))
);

  // ── 11. Check refill thresholds (non-blocking) ───────────────────────────
  checkDifficultyRefillThreshold(supabase).then((flags) => {
    if (flags?.needs40Refill) console.log("[Orchestrator] 40q pool needs refill");
    if (flags?.needs60Refill) console.log("[Orchestrator] 60q pool needs refill");
  });

  checkTopicRefillThreshold(supabase, allSubjectIds).then((flags) => {
    if (!flags) return;
    for (const [subjectId, { needsRefill }] of Object.entries(flags)) {
      if (needsRefill) console.log(`[Orchestrator] Topic pool needs refill for subject: ${subjectId}`);
    }
  });

  return { data: session, status: 200 };
}
