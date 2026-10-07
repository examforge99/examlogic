'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { ArrowUpRight, BarChart3, BookOpen, CalendarDays, ChevronRight, Clock3, House, Play, UserRound } from 'lucide-react'
import Link from 'next/link'
import TodayMission, { type Mission } from '@/components/nba/TodayMission'
import RecentActivity, { type RecentActivityItem } from '@/components/RecentActivity'

type Schedule = {
  date: string
  day_type: 'practice' | 'rest'
  subjects: string[]
  planned_seconds: number
  used_seconds: number
  remaining_seconds: number
}

type DashboardPayload = {
  missions: Mission[]
  activities: RecentActivityItem[]
  schedule: Schedule | null
}

const nav = [
  { href: '/dashboard', label: 'Home', icon: House },
  { href: '/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/practice', label: 'Practice', icon: Play, featured: true },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: UserRound },
]

function formatDuration(seconds: number) {
  const minutes = Math.max(0, Math.round(seconds / 60))
  if (minutes < 60) return minutes + ' min'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? hours + 'h ' + rest + 'm' : hours + 'h'
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [payload, setPayload] = useState<DashboardPayload | null>(null)
  const [errors, setErrors] = useState({ mission: false, activity: false, schedule: false })

  const refresh = useCallback(async () => {
    const headers = { Accept: 'application/json', 'Cache-Control': 'no-store' }
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

    setErrors({
      mission: results[0].status === 'rejected',
      activity: results[1].status === 'rejected',
      schedule: results[2].status === 'rejected',
    })

    setPayload({
      missions: results[0].status === 'fulfilled' && Array.isArray(results[0].value?.missions) ? results[0].value.missions : [],
      activities: results[1].status === 'fulfilled' && Array.isArray(results[1].value?.activities) ? results[1].value.activities : [],
      schedule: results[2].status === 'fulfilled' ? results[2].value : null,
    })
  }, [])

  useEffect(() => {
    if (isLoaded) void refresh()
  }, [isLoaded, refresh])

  const firstName = user?.firstName || user?.username || 'there'
  const progress = useMemo(() => {
    const schedule = payload?.schedule
    if (!schedule?.planned_seconds) return 0
    return Math.round(Math.max(0, Math.min(100, (schedule.used_seconds / schedule.planned_seconds) * 100)))
  }, [payload?.schedule])

  return (
    <div className="new-app">
      <header className="new-header">
        <div className="new-header-inner">
          <Link href="/dashboard" className="wordmark" aria-label="ExamLogic home">ExamLogic</Link>
          <div className="header-right">
            <span className="header-date">{new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())}</span>
            <Link href="/profile" className="profile-chip" aria-label="Open profile">{firstName.slice(0, 1).toUpperCase()}</Link>
          </div>
        </div>
      </header>

      <main className="new-main">
        <section className="welcome-line">
          <div>
            <p className="overline">Your preparation</p>
            <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {firstName}.</h1>
          </div>
          <p className="welcome-note">One place to know what matters now, what is next, and how you are progressing.</p>
        </section>

        <section className="mission-zone" aria-labelledby="mission-zone-title">
          <div className="section-kicker">
            <span>01</span>
            <h2 id="mission-zone-title">What matters now</h2>
          </div>
          <div className="mission-frame">
            <TodayMission
              initialMissions={payload?.missions}
              deferFetch
              initialError={errors.mission ? 'Today’s mission is temporarily unavailable. Please try again.' : null}
              onDashboardRefresh={refresh}
            />
          </div>
        </section>

        <section className="context-zone" aria-labelledby="context-title">
          <div className="section-kicker">
            <span>02</span>
            <h2 id="context-title">Keep your bearings</h2>
          </div>
          <div className="context-grid">
            <article className="context-primary">
              <div className="context-topline"><span>Study time</span><Clock3 size={15} /></div>
              <strong>{formatDuration(payload?.schedule?.used_seconds ?? 0)}</strong>
              <p>{progress}% of {formatDuration(payload?.schedule?.planned_seconds ?? 0)} planned today</p>
              <div className="meter"><span style={{ width: progress + '%' }} /></div>
            </article>
            <article className="context-secondary">
              <div className="context-topline"><span>Still available</span><CalendarDays size={15} /></div>
              <strong>{formatDuration(payload?.schedule?.remaining_seconds ?? 0)}</strong>
              <p>{payload?.schedule?.day_type === 'rest' ? 'Today is a rest day.' : 'Remaining from today’s plan.'}</p>
            </article>
          </div>
        </section>

        <section className="schedule-zone" aria-labelledby="schedule-title">
          <div className="section-heading">
            <div>
              <p className="overline">Plan</p>
              <h2 id="schedule-title">Today’s timetable</h2>
            </div>
            <Link href="/timetable" className="text-link">Open timetable <ArrowUpRight size={14} /></Link>
          </div>
          <div className="schedule-surface">
            {errors.schedule ? (
              <div className="inline-state"><strong>Timetable unavailable</strong><span>We couldn't retrieve today's plan.</span><button type="button" onClick={() => void refresh()}>Try again</button></div>
            ) : payload?.schedule?.day_type === 'practice' && payload.schedule.subjects.length ? (
              payload.schedule.subjects.map((subject, index) => (
                <div className="schedule-row" key={subject}>
                  <span className="schedule-index">0{index + 1}</span>
                  <div><strong>{subject}</strong><span>{index === 0 ? 'Primary focus today' : 'Scheduled today'}</span></div>
                  <ChevronRight size={16} />
                </div>
              ))
            ) : (
              <div className="rest-state"><strong>Rest day</strong><span>Your timetable has no study subjects scheduled today.</span></div>
            )}
          </div>
        </section>

        <section className="activity-zone" aria-labelledby="activity-title">
          <div className="section-heading">
            <div>
              <p className="overline">History</p>
              <h2 id="activity-title">Recent activity</h2>
            </div>
            <Link href="/analytics" className="text-link">View progress <ArrowUpRight size={14} /></Link>
          </div>
          <RecentActivity activities={payload?.activities} deferFetch initialError={errors.activity} />
        </section>
      </main>

      <nav className="new-bottom-nav" aria-label="Primary navigation">
        {nav.map(({ href, label, icon: Icon, featured }) => (
          <Link key={href} href={href} className={featured ? 'new-nav-item featured' : 'new-nav-item'}>
            {featured ? <span className="new-nav-feature"><Icon size={19} /></span> : <Icon size={19} />}
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
