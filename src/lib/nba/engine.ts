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
  topic_name?: string;
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
type NbaBatch = {
  id: string;
  batch_date: string;
  batch_number: number;
  status: 'active' | 'completed';
};

type NbaLog = {
  id?: string;
  batch_id: string;
  subject_id: string;
  topic_id: string | null;
  concept_window_id: string | null;
  action_type: ActionType;
  phase: Phase;
  fired_at: string;
  status: 'pending' | 'completed';
  completed_at?: string | null;
  boundary_state: BoundaryState;
};

function today() {
  return new Date().toISOString().slice(0, 10);
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

async function getActiveBatch(db: ReturnType<typeof getNBAClient>, userId: string, date: string) {
  const { data, error } = await db
    .from('nba_batches')
    .select('id,batch_date,batch_number,status')
    .eq('user_id', userId)
    .eq('batch_date', date)
    .eq('status', 'active')
    .maybeSingle<NbaBatch>();
  if (error) throw error;
  return data;
}

async function returnBatch(
  db: ReturnType<typeof getNBAClient>,
  batch: NbaBatch,
  conceptById: Map<string, Concept>,
  phase: Phase,
  subjectNameById: Map<string, string>,
  topicNameById: Map<string, string>,
) {
  const { data, error } = await db
    .from('nba_log')
    .select('id,batch_id,subject_id,topic_id,concept_window_id,action_type,phase,fired_at,status,completed_at,boundary_state')
    .eq('batch_id', batch.id)
    .order('fired_at', { ascending: true });
  if (error) throw error;

  return ((data ?? []) as NbaLog[])
    .filter(log => log.concept_window_id && conceptById.has(log.concept_window_id))
    .map(log => toOutput(log, conceptById.get(log.concept_window_id!)!, topicNameById, phase, subjectNameById.get(log.subject_id), batch.id));
}

function toOutput(
  log: NbaLog,
  concept: Concept,
  topicNameById: Map<string, string>,
  phase: Phase,
  subjectName: string | undefined,
  batchId: string,
): NBAOutput {
  const estimated_minutes = estimatedMinutes(concept, log.action_type);
  const boundary = log.boundary_state ?? {
    time_boundary_reached: false,
    topic_concept_boundary_reached: false,
    continuation_available: true,
    subject_exhausted: false,
  };

  return {
    batch_id: batchId,
    subject_id: log.subject_id,
    subject_name: subjectName,
    topic_id: log.topic_id ?? concept.topic_id,
    topic_name: topicNameById.get(log.topic_id ?? concept.topic_id),
    concept_window_id: concept.id,
    concept_name: concept.name,
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

  const { data: subjectRows, error: subjectsError } = await db
    .from('subjects')
    .select('id,name')
    .in('id', subjectIds);
  if (subjectsError) throw subjectsError;
  const subjectNameById = new Map((subjectRows ?? []).map((subject: { id: string; name: string }) => [subject.id, subject.name]));

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
  const topicNameById = new Map(topicRows.map(topic => [topic.id, topic.name]));
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

  const { data: activeBatch, error: activeBatchError } = await db
    .from('nba_batches')
    .select('id,batch_date,batch_number,status')
    .eq('user_id', user_id)
    .eq('batch_date', date)
    .eq('status', 'active')
    .maybeSingle<NbaBatch>();

  if (activeBatchError) throw activeBatchError;

  const { data: allLogs, error: allLogsError } = await db
    .from('nba_log')
    .select('id,batch_id,subject_id,topic_id,concept_window_id,action_type,phase,fired_at,status,completed_at,boundary_state')
    .eq('user_id', user_id)
    .eq('status', 'completed')
    .in('concept_window_id', conceptIds);

  if (allLogsError) throw allLogsError;

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

  const conceptById = new Map(conceptRows.map(concept => [concept.id, concept]));

  if (activeBatch) {
    return returnBatch(db, activeBatch, conceptById, phase, subjectNameById, topicNameById);
  }

  const completedConcepts = new Set(
    ((allLogs ?? []) as NbaLog[])
      .map(log => log.concept_window_id)
      .filter((id): id is string => Boolean(id)),
  );

  const totalMinutes = user.daily_hours == null ? 0 : Number(user.daily_hours) * 60;
  if (totalMinutes <= 0) return [];

  const fairShare = totalMinutes / subjectIds.length;
  const usedBySubject = new Map<string, number>(
    subjectIds.map(subjectId => [subjectId, 0]),
  );

  const reservedConcepts = new Set(completedConcepts);

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
        .find(concept => !reservedConcepts.has(concept.id));

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

  const schedule: NBAOutput[] = [];
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
        batch_id: '',
        subject_id: subjectId,
        subject_name: subjectNameById.get(subjectId) ?? undefined,
        topic_id: topic.id,
        topic_name: topic.name,
        concept_window_id: concept.id,
        concept_name: concept.name,
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
      reservedConcepts.add(concept.id);
      madeProgress = true;
    }
  }

  if (!schedule.length) return [];

  const { data: latestBatch, error: latestBatchError } = await db
    .from('nba_batches')
    .select('batch_number')
    .eq('user_id', user_id)
    .eq('batch_date', date)
    .order('batch_number', { ascending: false })
    .limit(1)
    .maybeSingle<{ batch_number: number }>();

  if (latestBatchError) throw latestBatchError;

  const { data: batch, error: batchError } = await db
    .from('nba_batches')
    .insert({
      user_id,
      batch_date: date,
      batch_number: (latestBatch?.batch_number ?? 0) + 1,
      status: 'active',
    })
    .select('id,batch_date,batch_number,status')
    .single<NbaBatch>();

  if (batchError) {
    const racedBatch = await getActiveBatch(db, user_id, date);
    if (racedBatch) return returnBatch(db, racedBatch, conceptById, phase, subjectNameById, topicNameById);
    throw batchError;
  }

  for (const output of schedule) output.batch_id = batch.id;

  const rows = schedule.map(output => ({
    user_id,
    batch_id: batch.id,
    subject_id: output.subject_id,
    topic_id: output.topic_id,
    concept_window_id: output.concept_window_id,
    action_type: output.action_type,
    phase,
    fired_at: new Date().toISOString(),
    status: 'pending',
    boundary_state: {
      time_boundary_reached: output.time_boundary_reached,
      topic_concept_boundary_reached: output.topic_concept_boundary_reached,
      continuation_available: output.continuation_available,
      subject_exhausted: output.subject_exhausted,
    },
  }));

  const { error: logError } = await db.from('nba_log').insert(rows);
  if (logError) {
    await db.from('nba_batches').delete().eq('id', batch.id);
    throw logError;
  }

  return schedule;
}
