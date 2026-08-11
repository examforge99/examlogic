// hooks/useDashboard.ts
'use client'

import { useState, useEffect } from 'react'
import { dashboardApi } from '@/lib/api'
import type {
  Session,
  AnalyticsPageStats,
  SubjectPerformance,
  UserProgress,
} from '@/lib/types'

interface DashboardData {
  recentSessions: Session[]
  stats:          AnalyticsPageStats
  subjects:       SubjectPerformance[]
  progress:       UserProgress
}

export function useDashboard() {
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    dashboardApi.getDashboard()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const refetch = () => {
    setLoading(true)
    dashboardApi.getDashboard()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  return { data, loading, error, refetch }
}
