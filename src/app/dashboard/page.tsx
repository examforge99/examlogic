'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { ArrowRight, CalendarDays } from 'lucide-react'
import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import TodayMission, { type Mission } from '@/components/nba/TodayMission'
import RecentActivity from '@/components/RecentActivity'

type DashboardData = {
  missions: Mission[]
  activities: import('@/components/RecentActivity').RecentActivityItem[]
  schedule: {
    date: string
    day_type: 'practice' | 'rest'
    subjects: string[]
    planned_seconds: number
    used_seconds: number
    remaining_seconds: number
  } | null
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--color-background)' } as const,
  main: { width: '100%', maxWidth: 680, margin: '0 auto', padding: '24px 16px 112px', boxSizing: 'border-box' } as const,
  stack: { display: 'grid', gap: 24 } as const,
  section: { display: 'grid', gap: 12 } as const,
  eyebrow: { margin: 0, color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' as const } as const,
  heading: { margin: 0, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1.2, fontWeight: 700, letterSpacing: '-.025em' } as const,
  muted: { margin: 0, color: 'var(--color-text-muted)', fontSize: 12, lineHeight: 1.5 } as const,
  surface: { border: '1px solid var(--color-border)', borderRadius: 14, background: 'var(--color-surface)', padding: 16, boxSizing: 'border-box' } as const,
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
      fetch('/api/nba/fire', { method: 'POST', cache: 'no-store', headers }).then(async r => { if (!r.ok) throw new Error('mission'); return r.json() }),
      fetch('/api/recent-activity', { cache: 'no-store', headers }).then(async r => { if (!r.ok) throw new Error('activity'); return r.json() }),
      fetch('/api/timetable/today', { cache: 'no-store', headers }).then(async r => { if (!r.ok) throw new Error('schedule'); return r.json() }),
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
        subtitle="Here’s what matters today."
      />

      <main style={styles.main}>
        <div style={styles.stack}>
          <TodayMission
            initialMissions={data?.missions}
            deferFetch
            initialError={apiErrors.mission ? 'Today’s mission is temporarily unavailable. Please try again.' : null}
            onDashboardRefresh={loadDashboard}
          />

          <section style={styles.section} aria-labelledby="today-context-title">
            <div>
              <p style={styles.eyebrow}>Today</p>
              <h2 id="today-context-title" style={styles.heading}>Keep the plan in view.</h2>
              <p style={{ ...styles.muted, marginTop: 4 }}>A little context, without competing with your next action.</p>
            </div>

            <div className="dashboard-context-grid">
              <div className="dashboard-stat">
                <p className="dashboard-stat-label">Progress</p>
                <p className="dashboard-stat-value">{Math.round(progress)}%</p>
                <div className="dashboard-progress-track" aria-label={Math.round(progress) + '% of planned study time completed'}>
                  <span style={{ width: progress + '%' }} />
                </div>
              </div>
              <div className="dashboard-stat">
                <p className="dashboard-stat-label">Remaining</p>
                <p className="dashboard-stat-value">{formatTime(remaining)}</p>
                <p className="dashboard-stat-note">of {formatTime(planned)} planned</p>
              </div>
            </div>
          </section>

          <section style={styles.section} aria-labelledby="today-timetable-title">
            <div className="dashboard-section-header">
              <div>
                <p style={styles.eyebrow}>Schedule</p>
                <h2 id="today-timetable-title" style={styles.heading}>Today’s timetable</h2>
              </div>
              <button className="dashboard-inline-link" type="button" onClick={() => { window.location.href = '/timetable' }}>
                Full timetable <ArrowRight size={14} />
              </button>
            </div>

            <div style={styles.surface}>
              {apiErrors.schedule ? (
                <div>
                  <p style={styles.muted}>Today’s timetable is temporarily unavailable.</p>
                  <button className="dashboard-inline-link dashboard-retry" type="button" onClick={() => void loadDashboard()}>Try again</button>
                </div>
              ) : schedule?.day_type === 'practice' && schedule.subjects.length ? (
                <div className="dashboard-schedule-list">
                  {schedule.subjects.slice(0, 3).map((subject, index) => (
                    <div key={subject} className="dashboard-schedule-row">
                      <div>
                        <p className="dashboard-schedule-subject">{subject}</p>
                        <p className="dashboard-schedule-meta">{index === 0 ? 'Scheduled today' : 'Also scheduled today'}</p>
                      </div>
                      <CalendarDays size={16} aria-hidden="true" />
                    </div>
                  ))}
                  {schedule.subjects.length > 3 ? <p className="dashboard-schedule-more">+{schedule.subjects.length - 3} more subjects</p> : null}
                </div>
              ) : (
                <div className="dashboard-rest">
                  <p className="dashboard-schedule-subject">Rest day</p>
                  <p className="dashboard-schedule-meta">No subjects are scheduled today.</p>
                </div>
              )}
            </div>
          </section>

          <RecentActivity activities={data?.activities} deferFetch initialError={apiErrors.activity} />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
