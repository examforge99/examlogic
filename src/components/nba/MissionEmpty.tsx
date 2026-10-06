'use client'

import Link from 'next/link'

export type MissionReason = 'no_timetable' | 'no_exam_date' | 'rest_day' | 'no_hours' | 'no_content' | 'all_done'

const COPY: Record<MissionReason, { title: string; message: string; action: string; href?: string }> = {
  no_timetable: { title: 'Your timetable isn’t ready yet.', message: 'Set up your study timetable so ExamLogic knows what to focus on today.', action: 'Set up timetable', href: '/onboarding' },
  no_exam_date: { title: 'Add your exam date first.', message: 'Your exam date helps ExamLogic set the right study focus for you.', action: 'Set exam date', href: '/onboarding' },
  rest_day: { title: 'Rest day, no mission today.', message: 'Take the day off. Your study plan has marked today as a rest day.', action: 'View dashboard', href: '/dashboard' },
  no_hours: { title: 'Set your study time.', message: 'Tell ExamLogic how much time you can study each day so it can plan today’s focus.', action: 'Set study time', href: '/onboarding' },
  no_content: { title: 'No study content is ready yet.', message: 'There isn’t an active concept available for today’s scheduled subjects.', action: 'Try again' },
  all_done: { title: 'You’re done for today.', message: 'You’ve completed the available work for today. Come back when your next mission is ready.', action: 'Check again' },
}

const styles = {
  card: { minHeight: 260, padding: 14, border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, background: '#0A0F14', boxShadow: '0 20px 40px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.06)' } as const,
  kicker: { margin: '0 0 8px', color: 'rgba(232,240,247,.72)', fontSize: 12 } as const,
  title: { margin: 0, color: '#F1F6FA', fontSize: 21, lineHeight: 1.15, letterSpacing: '-.025em' } as const,
  message: { margin: '10px 0 0', color: 'rgba(232,240,247,.68)', fontSize: 12, lineHeight: 1.6 } as const,
  action: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 42, marginTop: 22, border: 0, borderRadius: 10, background: '#3FB7FF', color: '#06182A', fontSize: 12, fontWeight: 800, textDecoration: 'none' } as const,
}

export default function MissionEmpty({ reason, onAction, busy = false }: { reason: MissionReason; onAction: () => void; busy?: boolean }) {
  const copy = COPY[reason]
  return (
    <div style={styles.card}>
      <p style={styles.kicker}>Today’s Mission</p>
      <h2 style={styles.title}>{copy.title}</h2>
      <p style={styles.message}>{copy.message}</p>
      {copy.href ? (
        <Link href={copy.href} style={styles.action}>{copy.action} <span aria-hidden='true' style={{ marginLeft: 7 }}>→</span></Link>
      ) : (
        <button style={styles.action} onClick={onAction} disabled={busy}>
          {busy ? 'Checking…' : copy.action} <span aria-hidden='true' style={{ marginLeft: 7 }}>→</span>
        </button>
      )}
      <style>{`
        button:disabled { opacity: .55; cursor: not-allowed; }
        button:focus-visible, a:focus-visible { outline: 3px solid rgba(63,183,255,.55); outline-offset: 2px; }
        button:active:not(:disabled), a:active { transform: translateY(1px); }
      `}</style>
    </div>
  )
}
