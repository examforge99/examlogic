'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { ArrowRight, CalendarDays } from 'lucide-react'
import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import TodayMission, { type Mission } from '@/components/nba/TodayMission'
import RecentActivity from '@/components/RecentActivity'
import type { RecentActivityItem } from '@/components/RecentActivity'
import { COLORS } from '@/lib/design/colors'

type DashboardData = {
  missions: Mission[]
  activities: RecentActivityItem[]
  schedule: {
    date: string
    day_type: 'practice' | 'rest'
    subjects: string[]
    planned_seconds: number
    used_seconds: number
    remaining_seconds: number
  } | null
}

const colors = {
  bg: COLORS.background,
  surface: COLORS.surface,
  elevated: COLORS.elevated,
  primary: COLORS.primary,
  accent: COLORS.accent,
  warning: COLORS.status.warning,
  text: COLORS.text.primary,
  muted: COLORS.text.muted,
  border: COLORS.border,
} as const

const styles = {
  page: { minHeight: '100vh', background: colors.bg } as const,
  main: {
    width: '100%',
    maxWidth: 620,
    margin: '0 auto',
    padding: '18px 16px 120px',
    boxSizing: 'border-box',
  } as const,
  stack: { display: 'grid', gap: 14 } as const,
  card: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid ' + colors.border,
    borderRadius: 16,
    background: colors.surface,
    padding: 18,
  } as const,
  hero: {
    minHeight: 300,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  } as const,
  eyebrow: { margin: 0, color: colors.primary, fontSize: 11, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase' as const } as const,
  heading: { margin: '7px 0 0', color: colors.text, fontSize: 25, lineHeight: 1.15, fontWeight: 760, letterSpacing: '-.025em' } as const,
  muted: { margin: '6px 0 0', color: colors.muted, fontSize: 12, lineHeight: 1.5 } as const,
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 } as const,
  metric: { minHeight: 122, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } as const,
  metricLabel: { margin: 0, color: colors.muted, fontSize: 10, fontWeight: 750, letterSpacing: '.04em', textTransform: 'uppercase' as const } as const,
  metricValue: { margin: '12px 0 0', color: colors.text, fontSize: 25, lineHeight: 1, fontWeight: 760, letterSpacing: '-.03em' } as const,
  bar: { height: 6, overflow: 'hidden', borderRadius: 999, background: 'rgba(102,116,133,.16)' } as const,
  barFill: { height: '100%', borderRadius: 999, background: colors.primary, transition: 'width 400ms ease' } as const,
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 } as const,
  cardTitle: { margin: 0, color: colors.text, fontSize: 15, fontWeight: 760, letterSpacing: '-.015em' } as const,
  link: { display: 'inline-flex', alignItems: 'center', gap: 5, border: 0, background: 'transparent', color: colors.primary, padding: 0, fontSize: 11, fontWeight: 750, cursor: 'pointer' } as const,
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderBottom: '1px solid ' + colors.border } as const,
  rowMain: { minWidth: 0 } as const,
  rowTitle: { margin: 0, color: '#344054', fontSize: 13, fontWeight: 700 } as const,
  rowMeta: { margin: '4px 0 0', color: colors.muted, fontSize: 10 } as const,
  iconBox: { width: 32, height: 32, flex: '0 0 auto', display: 'grid', placeItems: 'center', borderRadius: 9, background: 'rgba(63,183,255,.08)', color: colors.primary } as const,
}

function formatTime(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours && mins) return hours + 'h ' + mins + 'm'
  if (hours) return hours + 'h'
  return mins + 'm'
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [apiErrors, setApiErrors] = useState({ mission: false, activity: false, schedule: false })

  const firstName = user?.firstName || user?.username || 'there'
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const loadDashboard = useCallback(async () => {
    const headers = { Accept: 'application/json', 'Cache-Control': 'no-cache, no-store, max-age=0' }
    const results = await Promise.allSettled([
      fetch('/api/nba/fire', { method: 'POST', cache: 'no-store', headers }).then(async r => {
        if (!r.ok) throw new Error('mission')
        return r.json()
      }),
      fetch('/api/recent-activity', { cache: 'no-store', headers }).then(async r => {
        if (!r.ok) throw new Error('activity')
        return r.json()
      }),
      fetch('/api/timetable/today', { cache: 'no-store', headers }).then(async r => {
        if (!r.ok) throw new Error('schedule')
        return r.json()
      }),
    ])

    setApiErrors({
      mission: results[0].status === 'rejected',
      activity: results[1].status === 'rejected',
      schedule: results[2].status === 'rejected',
    })
    setData({
      missions: results[0].status === 'fulfilled' && Array.isArray(results[0].value?.missions) ? results[0].value.missions : [],
      activities: results[1].status === 'fulfilled' && Array.isArray(results[1].value?.activities) ? results[1].value.activities : [],
      schedule: results[2].status === 'fulfilled' ? results[2].value : null,
    })
  }, [])

  useEffect(() => {
    if (isLoaded) void loadDashboard()
  }, [isLoaded, loadDashboard])

  const schedule = data?.schedule
  const planned = schedule?.planned_seconds ?? 0
  const remaining = schedule?.remaining_seconds ?? 0
  const progress = planned > 0 ? Math.max(0, Math.min(100, ((planned - remaining) / planned) * 100)) : 0

  return (
    <div style={styles.page}>
      <TopBar
        showBack={false}
        showNotif
        showAvatar
        avatarInitial={(firstName[0] || 'V').toUpperCase()}
        title={greeting + ', ' + firstName}
        subtitle="Here's what matters today."
      />

      <main style={styles.main}>
        <div style={styles.stack}>
          <TodayMission initialMissions={data?.missions} deferFetch initialError={apiErrors.mission ? 'Today’s mission is temporarily unavailable. Please try again.' : null} onDashboardRefresh={loadDashboard} />

          <div style={styles.metricGrid}>
            <section style={{ ...styles.card, ...styles.metric, background: colors.elevated }} aria-label="Today's progress">
              <div>
                <p style={styles.metricLabel}>Today's progress</p>
                <p style={styles.metricValue}>{Math.round(progress)}%</p>
              </div>
              <div style={styles.bar} aria-label={Math.round(progress) + '% of planned study time completed'}>
                <div style={{ ...styles.barFill, width: progress + '%' }} />
              </div>
            </section>

            <section style={{ ...styles.card, ...styles.metric, background: colors.elevated }} aria-label="Time remaining today">
              <div>
                <p style={styles.metricLabel}>Time remaining</p>
                <p style={styles.metricValue}>{formatTime(remaining)}</p>
              </div>
              <p style={{ ...styles.muted, margin: 0 }}>of {formatTime(planned)} planned</p>
            </section>
          </div>

          <section style={styles.card} aria-labelledby="today-timetable-title">
            <div style={styles.cardHeader}>
              <div>
                <h2 id="today-timetable-title" style={styles.cardTitle}>Today's timetable</h2>
                <p style={styles.muted}>A quick look at what is scheduled today.</p>
              </div>
              <button type="button" style={styles.link} onClick={() => { window.location.href = '/timetable' }}>
                Full timetable <ArrowRight size={13} />
              </button>
            </div>

            {apiErrors.schedule ? (
              <div style={{ paddingTop: 14 }}>
                <p style={{ ...styles.muted, margin: 0 }}>Today's timetable is temporarily unavailable.</p>
                <button type="button" style={{ ...styles.link, marginTop: 10 }} onClick={() => void loadDashboard()}>Try again</button>
              </div>
            ) : schedule?.day_type === 'practice' && schedule.subjects.length ? (
              <div style={{ marginTop: 8 }}>
                {schedule.subjects.slice(0, 2).map((subject, index) => (
                  <div key={subject} style={{ ...styles.row, borderBottom: index === Math.min(schedule.subjects.length, 2) - 1 ? '0' : styles.row.borderBottom }}>
                    <div style={styles.rowMain}>
                      <p style={styles.rowTitle}>{subject}</p>
                      <p style={styles.rowMeta}>{index === 0 ? 'Scheduled today' : 'Also scheduled today'}</p>
                    </div>
                    <CalendarDays size={16} color={colors.muted} aria-hidden="true" />
                  </div>
                ))}
                {schedule.subjects.length > 2 && <p style={{ ...styles.muted, margin: '11px 0 0' }}>+{schedule.subjects.length - 2} more subjects</p>}
              </div>
            ) : (
              <p style={{ ...styles.muted, marginTop: 16 }}>Rest day · no subjects scheduled.</p>
            )}
          </section>

          <RecentActivity activities={data?.activities} deferFetch initialError={apiErrors.activity} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
