'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import TodayMission from '@/components/nba/TodayMission'
import RecentActivity from '@/components/RecentActivity'
import TodaySchedule from '@/components/timetable/TodaySchedule'
import type { RecentActivityItem } from '@/components/RecentActivity'

type DashboardSnapshot = {
  missions: any[]
  activities: RecentActivityItem[]
  schedule: { date: string; day_type: 'practice' | 'rest'; subjects: string[]; planned_seconds: number; used_seconds: number; remaining_seconds: number } | null
  savedAt: number
}

const SNAPSHOT_TTL = 15 * 60 * 1000

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#071426' } as const,
  main: {
    width: '100%',
    maxWidth: 620,
    margin: '0 auto',
    padding: '12px 16px 120px',
    boxSizing: 'border-box',
  } as const,
  missionSection: { width: '100%' } as const,
  supportStack: {
    display: 'grid',
    gap: 22,
    marginTop: 22,
  } as const,
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const cacheKey = useMemo(
    () => user?.id ? `examlogic:dashboard:${user.id}` : null,
    [user?.id]
  )

  const loadDashboard = useCallback(async () => {
    if (!cacheKey) return

    const headers = { Accept: 'application/json' }
    const results = await Promise.allSettled([
      fetch('/api/nba/fire', { method: 'POST', cache: 'no-store', headers })
        .then(async response => {
          if (!response.ok) throw new Error('mission')
          return response.json()
        }),
      fetch('/api/recent-activity', { cache: 'no-store', headers })
        .then(async response => {
          if (!response.ok) throw new Error('activity')
          return response.json()
        }),
      fetch('/api/timetable/today', { cache: 'no-store', headers })
        .then(async response => {
          if (!response.ok) throw new Error('schedule')
          return response.json()
        }),
    ])

    setSnapshot(current => ({
      missions:
        results[0].status === 'fulfilled' && Array.isArray(results[0].value?.missions)
          ? results[0].value.missions
          : current?.missions ?? [],
      activities:
        results[1].status === 'fulfilled' && Array.isArray(results[1].value?.activities)
          ? results[1].value.activities
          : current?.activities ?? [],
      schedule:
        results[2].status === 'fulfilled'
          ? results[2].value
          : current?.schedule ?? null,
      savedAt: Date.now(),
    }))
  }, [cacheKey])

  useEffect(() => {
    if (!isLoaded || !cacheKey) return

    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) {
        const cached = JSON.parse(raw) as DashboardSnapshot
        if (cached && Date.now() - cached.savedAt < SNAPSHOT_TTL) {
          setSnapshot(cached)
        }
      }
    } catch {}

    void loadDashboard()
  }, [isLoaded, cacheKey, loadDashboard])

  useEffect(() => {
    if (!cacheKey || !snapshot) return
    try {
      localStorage.setItem(cacheKey, JSON.stringify(snapshot))
    } catch {}
  }, [cacheKey, snapshot])

  return (
    <div style={styles.page}>
      <TopBar showBack={false} showNotif={true} showAvatar={true} avatarInitial='V' />
      <main style={styles.main}>
        <section style={styles.missionSection} aria-label="Today's focus">
          <TodayMission initialMissions={snapshot?.missions} deferFetch />
        </section>

        <div style={styles.supportStack}>
          <TodaySchedule initialData={snapshot?.schedule} deferFetch />
          <RecentActivity activities={snapshot?.activities} deferFetch />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
