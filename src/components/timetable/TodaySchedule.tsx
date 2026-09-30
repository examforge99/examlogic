'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, RotateCw } from 'lucide-react'
import { COLORS } from '@/lib/colors'

type TodayScheduleData = {
  date: string
  day_type: 'practice' | 'rest'
  subjects: string[]
  planned_seconds: number
  used_seconds: number
  remaining_seconds: number
}

type ScheduleState = 'loading' | 'success' | 'empty' | 'error'

const styles = {
  card: {
    width: '100%',
    boxSizing: 'border-box',
    padding: 18,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    background: COLORS.surface,
    boxShadow: 'var(--shadow-card)',
    color: COLORS.textPrimary,
  } as const,
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 } as const,
  title: { margin: 0, fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 750, letterSpacing: '-.01em' } as const,
  link: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: 0, border: 0, background: 'transparent', color: COLORS.textSecondary, fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 650, cursor: 'pointer' } as const,
  date: { margin: '18px 0 7px', color: COLORS.textSecondary, fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const } as const,
  subjects: { margin: 0, color: COLORS.textPrimary, fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.5, fontWeight: 650 } as const,
  tank: { height: 8, marginTop: 18, overflow: 'hidden', borderRadius: 999, background: 'rgba(7,20,38,.55)' } as const,
  fill: { height: '100%', borderRadius: 999, background: COLORS.accent, transition: 'width 500ms ease' } as const,
  meta: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 10 } as const,
  remaining: { margin: 0, color: COLORS.textPrimary, fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 13, fontWeight: 700 } as const,
  planned: { margin: 0, color: COLORS.textSecondary, fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 } as const,
  empty: { margin: '18px 0 0', color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.5 } as const,
  error: { margin: '18px 0 0', color: '#FFB4B4', fontSize: 13, lineHeight: 1.5 } as const,
  retry: { display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, padding: 0, border: 0, background: 'transparent', color: COLORS.primary, fontSize: 11, fontWeight: 700, cursor: 'pointer' } as const,
  skeleton: { borderRadius: 7, background: 'rgba(232,240,247,.07)' } as const,
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
  const [state, setState] = useState<ScheduleState>('loading')

  async function loadSchedule() {
    setState('loading')
    try {
      const response = await fetch('/api/timetable/today', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })

      if (response.status === 404) {
        setData(null)
        setState('empty')
        return
      }

      if (!response.ok) throw new Error('Failed to load timetable')

      const result = (await response.json()) as TodayScheduleData
      setData(result)
      setState('success')
    } catch {
      setData(null)
      setState('error')
    }
  }

  useEffect(() => {
    void loadSchedule()
  }, [])

  const planned = data?.planned_seconds ?? 0
  const remaining = data?.remaining_seconds ?? 0
  const fill = planned > 0 ? Math.max(0, Math.min(100, remaining / planned * 100)) : 0

  return (
    <section style={styles.card} aria-label="Today's schedule" aria-busy={state === 'loading'}>
      <div style={styles.header}>
        <h2 style={styles.title}>Today's schedule</h2>
        <button type="button" style={styles.link} onClick={() => { window.location.href = '/timetable' }}>
          View timetable <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>

      {state === 'loading' && (
        <div aria-label="Loading today's schedule">
          <div style={{ ...styles.skeleton, width: 112, height: 10, marginTop: 18 }} />
          <div style={{ ...styles.skeleton, width: '72%', height: 14, marginTop: 12 }} />
          <div style={{ ...styles.skeleton, width: '100%', height: 8, marginTop: 18 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 10 }}>
            <div style={{ ...styles.skeleton, width: 92, height: 10 }} />
            <div style={{ ...styles.skeleton, width: 52, height: 10 }} />
          </div>
        </div>
      )}

      {state === 'error' && (
        <div>
          <p style={styles.error}>We couldn’t load today’s timetable.</p>
          <button type="button" style={styles.retry} onClick={() => void loadSchedule()}>
            <RotateCw size={12} /> Try again
          </button>
        </div>
      )}

      {state === 'empty' && (
        <div>
          <p style={styles.empty}>Your timetable isn’t ready yet. Set it up so ExamLogic can plan today’s study focus.</p>
          <button type="button" style={styles.retry} onClick={() => { window.location.href = '/onboarding' }}>
            Set up timetable <ArrowRight size={12} />
          </button>
        </div>
      )}

      {state === 'success' && data?.day_type === 'practice' && (
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
      )}

      {state === 'success' && data?.day_type === 'rest' && (
        <p style={styles.empty}>Rest day · no study time planned.</p>
      )}
    </section>
  )
}
