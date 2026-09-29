import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ACTION_LABELS: Record<string, 'Read' | 'Recall' | 'Practice' | undefined> = { READ: 'Read', RECALL: 'Recall', PRACTICE: 'Practice' }
const MODE_LABELS: Record<string, string> = { quick_fire: 'Quick Fire', campaign: 'Campaign', simulation: 'JAMB Simulation', sudden_death: 'Sudden Death' }

function formatDuration(seconds: number) {
  if (!seconds || seconds < 60) return '<1 min'
  return `${Math.round(seconds / 60)} min`
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createClient()
    const [{ data: nbaActivities, error: nbaError }, { data: sessionActivities, error: sessionError }] = await Promise.all([
      supabase.from('nba_log').select('id, action_type, completed_at, time_spent_seconds, subjects(name), topics(name)').eq('user_id', userId).eq('status', 'completed').not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(20),
      supabase.from('exam_sessions').select('id, mode, completed_at, total_time_seconds, subjects(name), topics(name)').eq('user_id', userId).eq('is_completed', true).not('completed_at', 'is', null).order('completed_at', { ascending: false }).limit(20),
    ])
    if (nbaError) throw nbaError
    if (sessionError) throw sessionError

    const activities = [
      ...(nbaActivities ?? []).map((item: any) => ({ id: `nba-${item.id}`, topic: item.topics?.name ?? 'Study activity', subject: item.subjects?.name ?? 'Unknown subject', mode: "Today's Mission", action: ACTION_LABELS[item.action_type], duration: formatDuration(item.time_spent_seconds ?? 0), timestamp: formatTimestamp(item.completed_at), completedAt: item.completed_at })),
      ...(sessionActivities ?? []).map((item: any) => ({ id: `session-${item.id}`, topic: item.topics?.name ?? 'Practice session', subject: item.subjects?.name ?? 'Unknown subject', mode: MODE_LABELS[item.mode] ?? item.mode, duration: formatDuration(item.total_time_seconds ?? 0), timestamp: formatTimestamp(item.completed_at), completedAt: item.completed_at })),
    ].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()).slice(0, 5).map(({ completedAt, ...activity }) => activity)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('[Recent Activity] Failed to load activities:', error)
    return NextResponse.json({ error: 'Failed to load recent activity.' }, { status: 500 })
  }
}