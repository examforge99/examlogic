import { resolveActionType, ACTION_MULTIPLIERS } from './actions';
import { checkBoundaries } from './boundaries';
import { getPhase } from './phase';
import { createClient } from '@supabase/supabase-js';
import type { ActionType, NBAOutput, Phase, BoundaryState } from './types';

function getNBAClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing Supabase secret key configuration');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

const MESSAGES: Record<ActionType, string> = {
  READ: 'Start here — read through {concept} first.',
  RECALL: 'Done reading? Quick check on {concept}.',
  PRACTICE: 'Time to test yourself on {concept}.',
  REVIEW: "Haven't touched this in a while. Quick refresh on {concept}.",
  DRILL: 'Exam is close. JAMB standard questions on {concept}.',
  RELEARN: "{concept} needs another look. Let's go again.",
};

type Topic = {
  id: string;
  name: string;
  section_id: string;
  progression_order: number;
  status: string;
  sections: { subject_id: string };
};

type Concept = {
  id: string;
  topic_id: string;
  name: string;
  description: string | null;
  progression_order: number;
  status: string;
  read_minutes: number;
};

type Mastery = { topic_id: string; is_complete: boolean };
type Attempt = { topic_id: string; is_correct: boolean | null; attempted_at: string | null };
type Day = {
  id: string;
  date: string;
  day_type: 'practice' | 'revision' | 'rest';
  scheduled_subject_ids: string[] | null;
};
type NbaLog = {
  subject_id: string;
  topic_id: string | null;
  concept_window_id: string | null;
  action_type: ActionType;
  phase: Phase;
  fired_at: string;
  boundary_state: BoundaryState;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrow(date: string) {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

function monthStart(d: string) {
  return `${d.slice(0, 7)}-01`;
}

function daysSince(v: string | null) {
  if (!v) return null;
  const t = Date.parse(v);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function stats(xs: Attempt[]) {
  if (!xs.length) return { attempts: 0, score: null as number | null, days_since: null as number | null };
  const score = (xs.filter(x => x.is_correct === true).length / xs.length) * 100;
  const latest = xs
    .filter(x => x.attempted_at)
    .sort((a, b) => Date.parse(b.attempted_at!) - Date.parse(a.attempted_at!))[0]?.attempted_at ?? null;
  return { attempts: xs.length, score, days_since: daysSince(latest) };
}

function message(action: ActionType, concept: string) {
  return MESSAGES[action].replace('{concept}', concept);
}

function estimatedMinutes(concept: Concept, action: ActionType) {
  return Number(concept.read_minutes ?? 10) * ACTION_MULTIPLIERS[action];
}

function logKey(conceptWindowId: string, action: ActionType) {
  return `${conceptWindowId}:${action}`;
}

function toOutput(
  log: NbaLog,
  concept: Concept,
  phase: Phase,
): NBAOutput {
  const estimated_minutes = estimatedMinutes(concept, log.action_type);
  const boundary = log.boundary_state ?? {
    time_boundary_reached: false,
    topic_concept_boundary_reached: false,
    continuation_available: true,
    subject_exhausted: false,
  };

  return {
    subject_id: log.subject_id,
    topic_id: log.topic_id ?? concept.topic_id,
    concept_window_id: concept.id,
    concept_progression_order: concept.progression_order,
    concept_description: concept.description,
    estimated_minutes,
    action_type: log.action_type,
    phase,
    message: message(log.action_type, concept.name),
    time_boundary_reached: boundary.time_boundary_reached,
    topic_concept_boundary_reached: boundary.topic_concept_boundary_reached,
    continuation_available: boundary.continuation_available,
    subject_exhausted: boundary.subject_exhausted,
    next_transition: null,
  };
}

export async function fireNBA(user_id: string): Promise<NBAOutput[]> {
  const db = getNBAClient();
  const date = today();

  const { data: user, error: userError } = await db
    .from('users')
    .select('exam_date,daily_hours')
    .eq('id', user_id)
    .maybeSingle();

  if (userError) throw userError;
  if (!user?.exam_date) return [];

  const { data: tt, error: ttError } = await db
    .from('monthly_timetable')
    .select('id')
    .eq('user_id', user_id)
    .eq('month', monthStart(date))
    .maybeSingle();

  if (ttError) throw ttError;
  if (!tt) return [];

  const { data: day, error: dayError } = await db
    .from('timetable_days')
    .select('id,date,day_type,scheduled_subject_ids')
    .eq('timetable_id', tt.id)
    .eq('date', date)
    .maybeSingle<Day>();

  if (dayError) throw dayError;
  if (!day || day.day_type !== 'practice') return [];

  const subjectIds = day.scheduled_subject_ids ?? [];
  if (!subjectIds.length) return [];

  const phase: Phase = getPhase(user.exam_date);

  const { data: topics, error: topicsError } = await db
    .from('topics')
    .select('id,name,section_id,progression_order,status,sections!inner(subject_id)')
    .in('sections.subject_id', subjectIds)
    .eq('status', 'active')
    .order('progression_order', { ascending: true })
    .order('id', { ascending: true });

  if (topicsError) throw topicsError;

  const topicRows = (topics ?? []) as unknown as Topic[];
  if (!topicRows.length) return [];

  const topicIds = topicRows.map(x => x.id);

  const [
    { data: masteryRows, error: masteryError },
    { data: concepts, error: conceptsError },
    { data: attempts, error: attemptsError },
  ] = await Promise.all([
    db.from('user_topic_mastery').select('topic_id,is_complete').eq('user_id', user_id).in('topic_id', topicIds),
    db.from('concept_windows')
      .select('id,topic_id,name,description,progression_order,status,read_minutes')
      .in('topic_id', topicIds)
      .eq('status', 'active')
      .order('progression_order', { ascending: true }),
    db.from('attempts').select('topic_id,is_correct,attempted_at').eq('user_id', user_id).in('topic_id', topicIds),
  ]);

  if (masteryError) throw masteryError;
  if (conceptsError) throw conceptsError;
  if (attemptsError) throw attemptsError;

  const conceptRows = (concepts ?? []) as Concept[];
  if (!conceptRows.length) return [];

  const conceptIds = conceptRows.map(concept => concept.id);

  const [
    { data: allLogs, error: allLogsError },
    { data: todayLogs, error: todayLogsError },
  ] = await Promise.all([
    db.from('nba_log')
      .select('subject_id,topic_id,concept_window_id,action_type,phase,fired_at,boundary_state')
      .eq('user_id', user_id)
      .in('concept_window_id', conceptIds),
    db.from('nba_log')
      .select('subject_id,topic_id,concept_window_id,action_type,phase,fired_at,boundary_state')
      .eq('user_id', user_id)
      .gte('fired_at', `${date}T00:00:00.000Z`)
      .lt('fired_at', `${tomorrow(date)}T00:00:00.000Z`),
  ]);

  if (allLogsError) throw allLogsError;
  if (todayLogsError) throw todayLogsError;
  const mastery = new Map((masteryRows ?? []).map((x: Mastery) => [x.topic_id, x]));

  const byTopic = new Map<string, Concept[]>();
  for (const concept of conceptRows) {
    const list = byTopic.get(concept.topic_id) ?? [];
    list.push(concept);
    byTopic.set(concept.topic_id, list);
  }

  const attemptsByTopic = new Map<string, Attempt[]>();
  for (const attempt of (attempts ?? []) as Attempt[]) {
    const list = attemptsByTopic.get(attempt.topic_id) ?? [];
    list.push(attempt);
    attemptsByTopic.set(attempt.topic_id, list);
  }

  const historicalLogs = (allLogs ?? []) as NbaLog[];
  const existingTodayLogs = (todayLogs ?? []) as NbaLog[];

  const conceptById = new Map(conceptRows.map(concept => [concept.id, concept]));
  const completedConcepts = new Set(
    historicalLogs
      .map(log => log.concept_window_id)
      .filter((id): id is string => Boolean(id)),
  );

  const todayKeys = new Set(
    existingTodayLogs
      .filter(log => log.concept_window_id)
      .map(log => logKey(log.concept_window_id!, log.action_type)),
  );

  const timeAlreadyUsed = new Map<string, number>();
  for (const log of existingTodayLogs) {
    if (!log.concept_window_id) continue;
    const concept = conceptById.get(log.concept_window_id);
    if (!concept) continue;

    const minutes = estimatedMinutes(concept, log.action_type);
    timeAlreadyUsed.set(
      log.subject_id,
      (timeAlreadyUsed.get(log.subject_id) ?? 0) + minutes,
    );
  }

  const scheduledExisting: NBAOutput[] = [];
  const existingIds = new Set<string>();

  for (const log of existingTodayLogs) {
    if (!log.concept_window_id) continue;
    const concept = conceptById.get(log.concept_window_id);
    if (!concept) continue;

    const key = `${log.subject_id}:${logKey(concept.id, log.action_type)}`;
    if (existingIds.has(key)) continue;
    existingIds.add(key);

    scheduledExisting.push(toOutput(log, concept, phase));
  }

  const totalMinutes = user.daily_hours == null ? 0 : Number(user.daily_hours) * 60;
  if (totalMinutes <= 0) return scheduledExisting;

  const fairShare = totalMinutes / subjectIds.length;
  const usedBySubject = new Map<string, number>(
    subjectIds.map(subjectId => [subjectId, timeAlreadyUsed.get(subjectId) ?? 0]),
  );

  const subjectTopics = new Map<string, Topic[]>();
  for (const subjectId of subjectIds) {
    subjectTopics.set(
      subjectId,
      topicRows
        .filter(topic => topic.sections.subject_id === subjectId)
        .sort((a, b) => a.progression_order - b.progression_order || a.id.localeCompare(b.id)),
    );
  }

  const nextConceptForSubject = (subjectId: string) => {
    for (const topic of subjectTopics.get(subjectId) ?? []) {
      if (mastery.get(topic.id)?.is_complete === true) continue;

      const next = (byTopic.get(topic.id) ?? [])
        .sort((a, b) => a.progression_order - b.progression_order || a.id.localeCompare(b.id))
        .find(concept => !completedConcepts.has(concept.id));

      if (next) {
        const topicStats = stats(attemptsByTopic.get(topic.id) ?? []);
        const action = resolveActionType(
          phase,
          topicStats.attempts,
          topicStats.score,
          topicStats.days_since,
        );

        return { topic, concept: next, action };
      }
    }

    return null;
  };

  const schedule: NBAOutput[] = [...scheduledExisting];
  let rolledMinutes = 0;
  let madeProgress = true;

  while (madeProgress) {
    madeProgress = false;

    for (const subjectId of subjectIds) {
      const candidate = nextConceptForSubject(subjectId);

      if (!candidate) {
        const baseRemaining = Math.max(0, fairShare - (usedBySubject.get(subjectId) ?? 0));
        rolledMinutes += baseRemaining;
        usedBySubject.set(subjectId, fairShare);
        continue;
      }

      const { topic, concept, action } = candidate;
      const estimated = estimatedMinutes(concept, action);
      const baseRemaining = Math.max(0, fairShare - (usedBySubject.get(subjectId) ?? 0));
      const available = baseRemaining + rolledMinutes;

      if (available < estimated * 0.7) {
        rolledMinutes += baseRemaining;
        usedBySubject.set(subjectId, fairShare);
        continue;
      }

      const extraNeeded = Math.max(0, estimated - baseRemaining);
      rolledMinutes = Math.max(0, rolledMinutes - extraNeeded);
      usedBySubject.set(subjectId, (usedBySubject.get(subjectId) ?? 0) + estimated);

      const topicConcepts = byTopic.get(topic.id) ?? [];
      const completedInTopic = topicConcepts.filter(c => completedConcepts.has(c.id)).length;
      const baseBoundary = checkBoundaries(
        Math.max(0, usedBySubject.get(subjectId) ?? 0),
        fairShare / 60,
        completedInTopic,
        topicConcepts.length,
      );

      const subjectHasMore = Boolean(nextConceptForSubject(subjectId));
      const boundary: BoundaryState = {
        ...baseBoundary,
        subject_exhausted: !subjectHasMore,
        continuation_available:
          !baseBoundary.time_boundary_reached &&
          !baseBoundary.topic_concept_boundary_reached &&
          subjectHasMore,
      };

      const output: NBAOutput = {
        subject_id: subjectId,
        topic_id: topic.id,
        concept_window_id: concept.id,
        concept_progression_order: concept.progression_order,
        concept_description: concept.description,
        estimated_minutes: estimated,
        action_type: action,
        phase,
        message: message(action, concept.name),
        time_boundary_reached: boundary.time_boundary_reached,
        topic_concept_boundary_reached: boundary.topic_concept_boundary_reached,
        continuation_available: boundary.continuation_available,
        subject_exhausted: boundary.subject_exhausted,
        next_transition: null,
      };

      schedule.push(output);

      if (!todayKeys.has(logKey(concept.id, action))) {
        const { error: logError } = await db.from('nba_log').insert({
          user_id,
          subject_id: subjectId,
          topic_id: topic.id,
          concept_window_id: concept.id,
          action_type: action,
          phase,
          fired_at: new Date().toISOString(),
          boundary_state: boundary,
        });

        if (logError) throw logError;
        todayKeys.add(logKey(concept.id, action));
      }

      completedConcepts.add(concept.id);
      madeProgress = true;
    }
  }

  return schedule;
}
