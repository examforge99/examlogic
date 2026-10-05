'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import TodayMission from '@/components/nba/TodayMission'
import RecentActivity from '@/components/RecentActivity'
import TodaySchedule from '@/components/timetable/TodaySchedule'
import type { RecentActivityItem } from '@/components/RecentActivity'

type DashboardData = {
  missions: any[]
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
  const { isLoaded } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)

  const loadDashboard = useCallback(async () => {
    const headers = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache, no-store, max-age=0',
    }

    const results = await Promise.allSettled([
      fetch('/api/nba/fire', {
        method: 'POST',
        cache: 'no-store',
        headers,
      }).then(async response => {
        if (!response.ok) throw new Error('mission')
        return response.json()
      }),
      fetch('/api/recent-activity', {
        cache: 'no-store',
        headers,
      }).then(async response => {
        if (!response.ok) throw new Error('activity')
        return response.json()
      }),
      fetch('/api/timetable/today', {
        cache: 'no-store',
        headers,
      }).then(async response => {
        if (!response.ok) throw new Error('schedule')
        return response.json()
      }),
    ])

    setData({
      missions:
        results[0].status === 'fulfilled' &&
        Array.isArray(results[0].value?.missions)
          ? results[0].value.missions
          : [],
      activities:
        results[1].status === 'fulfilled' &&
        Array.isArray(results[1].value?.activities)
          ? results[1].value.activities
          : [],
      schedule:
        results[2].status === 'fulfilled'
          ? results[2].value
          : null,
    })
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    void loadDashboard()
  }, [isLoaded, loadDashboard])

  return (
    <div style={styles.page}>
      <TopBar showBack={false} showNotif={true} showAvatar={true} avatarInitial='V' />
      <main style={styles.main}>
        <section style={styles.missionSection} aria-label="Today's focus">
          <TodayMission initialMissions={data?.missions} deferFetch />
        </section>

        <div style={styles.supportStack}>
          <TodaySchedule initialData={data?.schedule} deferFetch />
          <RecentActivity activities={data?.activities} deferFetch />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
