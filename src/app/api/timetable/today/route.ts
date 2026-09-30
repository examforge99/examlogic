import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function utcDate() { return new Date().toISOString().slice(0, 10) }
function monthStart(date: string) { return date.slice(0, 7) + '-01' }
function nextDate(date: string) { return new Date(new Date(date + 'T00:00:00Z').getTime() + 86400000).toISOString().slice(0, 10) }

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  try {
    const db = createClient()
    const date = utcDate()
    const month = monthStart(date)
    const { data: timetable, error: timetableError } = await db.from('monthly_timetable').select('id').eq('user_id', userId).eq('month', month).maybeSingle()
    if (timetableError) throw timetableError
    if (!timetable) return NextResponse.json({ error: 'TIMETABLE_NOT_READY' }, { status: 409 })
    const timetableId = timetable.id
    const { data: day, error: dayError } = await db.from('timetable_days').select('date,day_type,scheduled_subject_ids').eq('timetable_id', timetableId).eq('date', date).maybeSingle()
    if (dayError) throw dayError
    const { data: user, error: userError } = await db.from('users').select('daily_hours').eq('id', userId).single()
    if (userError) throw userError
    const tomorrow = nextDate(date)
    const [nbaResult, sessionResult] = await Promise.all([
      db.from('nba_log').select('time_spent_seconds').eq('user_id', userId).eq('status', 'completed').gte('completed_at', date + 'T00:00:00.000Z').lt('completed_at', tomorrow + 'T00:00:00.000Z'),
      db.from('exam_sessions').select('total_time_seconds').eq('user_id', userId).eq('is_completed', true).gte('completed_at', date + 'T00:00:00.000Z').lt('completed_at', tomorrow + 'T00:00:00.000Z'),
    ])
    if (nbaResult.error) throw nbaResult.error
    if (sessionResult.error) throw sessionResult.error
    const usedSeconds = (nbaResult.data ?? []).reduce((sum, row) => sum + (row.time_spent_seconds ?? 0), 0) + (sessionResult.data ?? []).reduce((sum, row) => sum + (row.total_time_seconds ?? 0), 0)
    const subjectIds = day?.scheduled_subject_ids ?? []
    const { data: subjects, error: subjectsError } = await db.from('subjects').select('id,name').in('id', subjectIds)
    if (subjectsError) throw subjectsError
    const subjectMap = new Map((subjects ?? []).map(subject => [subject.id, subject.name]))
    const orderedSubjects = subjectIds.map(id => subjectMap.get(id)).filter((name): name is string => Boolean(name))
    const plannedSeconds = Math.max(0, Number(user.daily_hours ?? 0) * 3600)
    return NextResponse.json({ date, day_type: day?.day_type ?? 'rest', subjects: orderedSubjects, planned_seconds: plannedSeconds, used_seconds: usedSeconds, remaining_seconds: Math.max(0, plannedSeconds - usedSeconds) })
  } catch (error) {
    console.error('[Timetable] Failed to load today:', error)
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 500 })
  }
}