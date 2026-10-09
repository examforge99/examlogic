'use client'

// src/app/dashboard/page.tsx
import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import type { Mission } from '@/components/nba/TodayMission'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import NextMoveSection from '@/components/dashboard/NextMoveSection'
import ExamCountdown from '@/components/dashboard/ExamCountdown'
import StudyTimeStats from '@/components/dashboard/StudyTimeStats'
import PracticeEntry from '@/components/dashboard/PracticeEntry'
import TodayPreparation, { type TodaySchedule } from '@/components/dashboard/TodayPreparation'
import SubscriptionPrompt from '@/components/dashboard/SubscriptionPrompt'
import FirstSessionModal from '@/components/dashboard/FirstSessionModal'
import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import { dashboardStyles as css } from '@/components/dashboard/styles'

type DashboardData = {
  missions: Mission[]
  schedule: TodaySchedule | null
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [missionError, setMissionError] = useState(false)
  const [firstUse, setFirstUse] = useState(false)
  const [examDate, setExamDate] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false
    let shouldShowFirstUse = false
    try {
      shouldShowFirstUse = !window.localStorage.getItem('examlogic:first-session-started')
      const savedExamDate = window.localStorage.getItem('examlogic:exam-date')
      if (savedExamDate) setExamDate(savedExamDate)
    } catch {
      // Storage may be unavailable; keep the dashboard usable.
    }

    fetch('/api/onboarding', { cache: 'no-store' })
      .then(async response => response.ok ? response.json() : null)
      .then(body => {
        if (cancelled) return
        if (body) {
          const current = body.current
          const setupComplete = Boolean(
            current?.exam_date &&
            (current.study_days?.length ?? 0) >= 5 &&
            Number(current.daily_hours) > 0 &&
            current.subject_ids?.length === 4 &&
            current.timetable_created
          )
          if (!setupComplete) {
            router.replace('/onboarding?redirect_url=%2Fdashboard')
            return
          }
        }
        setFirstUse(shouldShowFirstUse)
      })
      .catch(() => {
        if (!cancelled) setFirstUse(shouldShowFirstUse)
      })

    return () => { cancelled = true }
  }, [isLoaded, router])

  const loadDashboard = useCallback(async () => {
    const headers = { Accept: 'application/json', 'Cache-Control': 'no-cache, no-store, max-age=0' }
    const results = await Promise.allSettled([
      fetch('/api/nba/fire', { method: 'POST', cache: 'no-store', headers }).then(async response => {
        if (!response.ok) throw new Error('mission')
        return response.json()
      }),
      fetch('/api/timetable/today', { cache: 'no-store', headers }).then(async response => {
        if (!response.ok) throw new Error('schedule')
        return response.json()
      }),
    ])

    setMissionError(results[0].status === 'rejected')
    setData({
      missions: results[0].status === 'fulfilled' && Array.isArray(results[0].value?.missions)
        ? results[0].value.missions
        : [],
      schedule: results[1].status === 'fulfilled' ? results[1].value : null,
    })
  }, [])

  useEffect(() => {
    if (isLoaded) void loadDashboard()
  }, [isLoaded, loadDashboard])

  const beginFirstSession = () => {
    try {
      window.localStorage.setItem('examlogic:first-session-started', '1')
    } catch {
      // The session can still begin if storage is unavailable.
    }
    setFirstUse(false)
    router.push('/quick-fire')
  }

  const today = new Date()
  const daysRemaining = examDate
    ? Math.max(0, Math.ceil((new Date(examDate).getTime() - today.getTime()) / 86400000))
    : null
  const totalPrepDays = examDate
    ? Math.max(1, Math.ceil((new Date(examDate).getTime() - new Date(user?.createdAt || today).getTime()) / 86400000))
    : null
  const ringProgress = daysRemaining !== null && totalPrepDays
    ? Math.max(0, Math.min(100, daysRemaining / totalPrepDays * 100))
    : 34

  return (
    <div style={css.shell}>
      <DashboardHeader />

      <main style={css.main}>
        <ExamCountdown daysRemaining={daysRemaining} ringProgress={ringProgress} />

        <NextMoveSection missions={data?.missions} error={missionError} onRefresh={loadDashboard} />

        <StudyTimeStats
          usedSeconds={data?.schedule?.used_seconds ?? 0}
          plannedSeconds={data?.schedule?.planned_seconds ?? 0}
        />

        <PracticeEntry />
        <TodayPreparation schedule={data?.schedule ?? null} />
        <SubscriptionPrompt />
      </main>

      <DashboardNavigation />
      <FirstSessionModal open={firstUse} onStart={beginFirstSession} />
    </div>
  )
}
