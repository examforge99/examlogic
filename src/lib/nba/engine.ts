import { resolveActionType } from './actions';
import { checkBoundaries } from './boundaries';
import { getPhase } from './phase';
import { createClient } from '@supabase/supabase-js';

function getNBAClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Missing Supabase secret key configuration');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
import type { ActionType, NBAOutput, Phase, BoundaryState } from './types';

const MESSAGES: Record<ActionType, string> = {
  READ: 'Start here — read through {concept} first.',
  RECALL: 'Done reading? Quick check on {concept}.',
  PRACTICE: 'Time to test yourself on {concept}.',
  REVIEW: "Haven't touched this in a while. Quick refresh on {concept}.",
  DRILL: 'Exam is close. JAMB standard questions on {concept}.',
  RELEARN: "{concept} needs another look. Let's go again.",
};

type Topic = {
  id: string; name: string; section_id: string; progression_order: number; status: string;
  sections: { subject_id: string };
};
type Concept = { id: string; topic_id: string; name: string; progression_order: number; status: string };
type Mastery = { topic_id: string; is_complete: boolean };
type Attempt = { topic_id: string; is_correct: boolean | null; attempted_at: string | null };
type Day = { id: string; date: string; day_type: 'practice'|'revision'|'rest'; scheduled_subject_ids: string[]|null };

function today() { return new Date().toISOString().slice(0,10); }
function monthStart(d:string) { return `${d.slice(0,7)}-01`; }
function daysSince(v:string|null) {
  if (!v) return null;
  const t=Date.parse(v); if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now()-t)/86400000));
}
function stats(xs:Attempt[]) {
  if (!xs.length) return { attempts:0, score:null as number|null, days_since:null as number|null };
  const score=xs.filter(x=>x.is_correct===true).length/xs.length*100;
  const latest=xs.filter(x=>x.attempted_at).sort((a,b)=>Date.parse(b.attempted_at!)-Date.parse(a.attempted_at!))[0]?.attempted_at ?? null;
  return { attempts:xs.length, score, days_since:daysSince(latest) };
}
function message(action:ActionType, concept:string) { return MESSAGES[action].replace('{concept}',concept); }

export async function fireNBA(user_id:string):Promise<NBAOutput|null> {
  const db = getNBAClient();
  const date=today();

  const {data:user,error:userError}=await db.from('users').select('exam_date,daily_hours').eq('id',user_id).maybeSingle();
  if (userError) throw userError;
  if (!user) return null;
  if (!user.exam_date) return null;

  const {data:tt,error:ttError}=await db.from('monthly_timetable').select('id').eq('user_id',user_id).eq('month',monthStart(date)).maybeSingle();
  if (ttError) throw ttError;
  if (!tt) return null;

  const {data:day,error:dayError}=await db.from('timetable_days').select('id,date,day_type,scheduled_subject_ids').eq('timetable_id',tt.id).eq('date',date).maybeSingle<Day>();
  if (dayError) throw dayError;
  if (!day || day.day_type !== 'practice') return null;

  const subjectIds=day.scheduled_subject_ids ?? [];
  if (!subjectIds.length) return null;
  const phase:Phase=getPhase(user.exam_date);

  const {data:topics,error:topicsError}=await db.from('topics')
    .select('id,name,section_id,progression_order,status,sections!inner(subject_id)')
    .in('sections.subject_id',subjectIds).eq('status','active')
    .order('progression_order',{ascending:true}).order('id',{ascending:true});
  if (topicsError) throw topicsError;
  const topicRows=(topics??[]) as unknown as Topic[];
  if (!topicRows.length) return null;

  const topicIds=topicRows.map(x=>x.id);
  const [{data:masteryRows,error:me},{data:concepts,error:ce},{data:attempts,error:ae},{data:analytics,error:de}]=await Promise.all([
    db.from('user_topic_mastery').select('topic_id,is_complete').eq('user_id',user_id).in('topic_id',topicIds),
    db.from('concept_windows').select('id,topic_id,name,progression_order,status').in('topic_id',topicIds).eq('status','active').order('progression_order',{ascending:true}),
    db.from('attempts').select('topic_id,is_correct,attempted_at').eq('user_id',user_id).in('topic_id',topicIds),
    db.from('user_daily_analytics').select('study_time_mins').eq('user_id',user_id).eq('date',date).maybeSingle(),
  ]);
  if (me) throw me; if (ce) throw ce; if (ae) throw ae; if (de) throw de;

  const mastery=new Map((masteryRows??[]).map((x:Mastery)=>[x.topic_id,x]));
  const byTopic=new Map<string,Concept[]>();
  for(const c of (concepts??[]) as Concept[]) (byTopic.get(c.topic_id)??(byTopic.set(c.topic_id,[]),byTopic.get(c.topic_id)!)).push(c);
  const attemptsByTopic=new Map<string,Attempt[]>();
  for(const a of (attempts??[]) as Attempt[]) (attemptsByTopic.get(a.topic_id)??(attemptsByTopic.set(a.topic_id,[]),attemptsByTopic.get(a.topic_id)!)).push(a);

  const conceptIds=(concepts??[]).map((x:Concept)=>x.id);
  const completed=new Set<string>();
  if(conceptIds.length){
    const {data:logs,error:le}=await db.from('nba_log').select('concept_window_id').eq('user_id',user_id).in('action_type',['PRACTICE','DRILL','RECALL']).not('concept_window_id','is',null).in('concept_window_id',conceptIds);
    if(le) throw le;
    for(const x of logs??[]) if(x.concept_window_id) completed.add(x.concept_window_id);
  }

  const studyMinutes=Number(analytics?.study_time_mins ?? 0);
  const dailyHours=user.daily_hours == null ? null : Number(user.daily_hours);

  for(const subjectId of subjectIds){
    const subjectTopics=topicRows.filter(t=>t.sections.subject_id===subjectId).sort((a,b)=>a.progression_order-b.progression_order||a.id.localeCompare(b.id));
    for(const topic of subjectTopics){
      if(mastery.get(topic.id)?.is_complete===true) continue;
      const cs=(byTopic.get(topic.id)??[]).sort((a,b)=>a.progression_order-b.progression_order||a.id.localeCompare(b.id));
      const incomplete=cs.filter(c=>!completed.has(c.id));
      if(!incomplete.length) continue;
      const concept=incomplete[0];
      const s=stats(attemptsByTopic.get(topic.id)??[]);
      const action=resolveActionType(phase,s.attempts,s.score,s.days_since);
      const base=checkBoundaries(studyMinutes,dailyHours,cs.filter(c=>completed.has(c.id)).length,cs.length);
      const subjectExhausted=!subjectTopics.some(t=>{
        if(t.id===topic.id) return incomplete.length>1;
        if(mastery.get(t.id)?.is_complete===true) return false;
        return (byTopic.get(t.id)??[]).some(c=>!completed.has(c.id));
      });
      const boundary:BoundaryState={...base,subject_exhausted:subjectExhausted,continuation_available:!base.time_boundary_reached&&!base.topic_concept_boundary_reached&&!subjectExhausted};
      const output:NBAOutput={
        subject_id:subjectId,topic_id:topic.id,concept_window_id:concept.id,
        concept_progression_order:concept.progression_order,action_type:action,phase,
        message:message(action,concept.name),
        time_boundary_reached:boundary.time_boundary_reached,
        topic_concept_boundary_reached:boundary.topic_concept_boundary_reached,
        continuation_available:boundary.continuation_available,
        subject_exhausted:boundary.subject_exhausted,next_transition:null
      };
      const {error:logError}=await db.from('nba_log').insert({
        user_id,subject_id:subjectId,topic_id:topic.id,concept_window_id:concept.id,
        action_type:action,phase,fired_at:new Date().toISOString(),boundary_state:boundary
      });
      if(logError) throw logError;
      return output;
    }
  }
  return null;
}
