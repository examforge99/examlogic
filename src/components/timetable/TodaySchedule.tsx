'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'

type TodayScheduleData = { date: string; day_type: 'practice' | 'rest'; subjects: string[]; planned_seconds: number; used_seconds: number; remaining_seconds: number }

const styles = {
  section: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '18px 0',
    borderTop: '1px solid rgba(255,255,255,.075)',
    borderBottom: '1px solid rgba(255,255,255,.075)',
    color: '#E8F0F7',
  } as const,
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 } as const,
  title: { margin: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 750, letterSpacing: '-.01em' } as const,
  link: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0, border: 0, background: 'transparent', color: '#3FB7FF', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' } as const,
  date: { margin: '16px 0 7px', color: '#7D8A9A', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const } as const,
  subjects: { margin: 0, color: '#D8E0E8', fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.5, fontWeight: 650 } as const,
  tank: { height: 8, marginTop: 17, overflow: 'hidden', borderRadius: 999, background: 'rgba(15,21,53,.9)' } as const,
  fill: { height: '100%', borderRadius: 999, background: '#25D6A2', transition: 'width 500ms ease' } as const,
  meta: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 10 } as const,
  remaining: { margin: 0, color: '#E8F0F7', fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 13, fontWeight: 700 } as const,
  planned: { margin: 0, color: '#7D8A9A', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 } as const,
  empty: { margin: '16px 0 0', color: '#7D8A9A', fontSize: 13, lineHeight: 1.5 } as const,
}

function formatTime(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours && mins) return hours + 'h ' + mins + 'm'
  if (hours) return hours + 'h'
  return mins + 'm'
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-NG', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(date + 'T00:00:00Z'))
}

export default function TodaySchedule() {
  const [data, setData] = useState<TodayScheduleData | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/timetable/today', { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Failed to load')))
      .then(result => { if (active) setData(result as TodayScheduleData) })
      .catch(() => { if (active) setData(null) })
    return () => { active = false }
  }, [])

  const planned = data?.planned_seconds ?? 0
  const remaining = data?.remaining_seconds ?? 0
  const fill = planned > 0 ? Math.max(0, Math.min(100, remaining / planned * 100)) : 0

  return (
    <section style={styles.section} aria-label="Today's schedule">
      <div style={styles.header}>
        <h2 style={styles.title}>Today's schedule</h2>
        <button type='button' style={styles.link} onClick={() => { window.location.href = '/timetable' }}>
          View timetable <ArrowRight size={14} aria-hidden='true' />
        </button>
      </div>

      {data?.day_type === 'practice' ? (
        <>
          <p style={styles.date}>{formatDate(data.date)}</p>
          <p style={styles.subjects}>{data.subjects.length ? data.subjects.join(' · ') : 'No subjects scheduled'}</p>
          <div style={styles.tank} aria-label={formatTime(remaining) + ' remaining of ' + formatTime(planned)}>
            <div style={{ ...styles.fill, width: fill + '%' }} />
          </div>
          <div style={styles.meta}>
            <p style={styles.remaining}>{formatTime(remaining)} remaining</p>
            <p style={styles.planned}>of {formatTime(planned)}</p>
          </div>
        </>
      ) : (
        <p style={styles.empty}>Rest day · no study time planned.</p>
      )}
    </section>
  )
}
