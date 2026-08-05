// hooks/useAnalytics.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { analyticsApi, getCurrentMonth } from '@/lib/api'
import type {
  AnalyticsPeriod,
  AnalyticsPageStats,
  AccuracyDataPoint,
  ConsistencyMonth,
  DifficultyPerformance,
  ModePerformance,
  OverallReadiness,
} from '@/lib/types'

// ── Analytics page stats (top stat row) ──────────────────────────────────

export function useAnalyticsStats() {
  const [data,    setData]    = useState<AnalyticsPageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    analyticsApi.getPageStats()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

// ── Accuracy trend ────────────────────────────────────────────────────────

export function useAccuracyTrend(initialPeriod: AnalyticsPeriod = '30') {
  const [period,  setPeriod]  = useState<AnalyticsPeriod>(initialPeriod)
  const [data,    setData]    = useState<AccuracyDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetch = useCallback((p: AnalyticsPeriod) => {
    setLoading(true)
    setError(null)
    analyticsApi.getAccuracyTrend(p)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch(period)
  }, [period, fetch])

  const changePeriod = (p: AnalyticsPeriod) => {
    setPeriod(p)
  }

  return { data, loading, error, period, changePeriod }
}

// ── Consistency heatmap ───────────────────────────────────────────────────

export function useConsistency(initialMonth?: string) {
  const [month,   setMonth]   = useState(initialMonth ?? getCurrentMonth())
  const [data,    setData]    = useState<ConsistencyMonth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetch = useCallback((m: string) => {
    setLoading(true)
    setError(null)
    analyticsApi.getConsistency(m)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch(month)
  }, [month, fetch])

  const changeMonth = (m: string) => {
    setMonth(m)
  }

  return { data, loading, error, month, changeMonth }
}

// ── Difficulty performance ────────────────────────────────────────────────

export function useDifficultyPerformance() {
  const [data,    setData]    = useState<DifficultyPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    analyticsApi.getDifficultyPerformance()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

// ── Mode performance ──────────────────────────────────────────────────────

export function useModePerformance() {
  const [data,    setData]    = useState<ModePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    analyticsApi.getModePerformance()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

// ── Overall readiness ─────────────────────────────────────────────────────

export function useOverallReadiness() {
  const [data,    setData]    = useState<OverallReadiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    analyticsApi.getOverallReadiness()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

// ── Full analytics page (parallel fetch) ─────────────────────────────────

export function useAnalyticsPage(
  period: AnalyticsPeriod = '30',
  month?: string
) {
  const [data,    setData]    = useState<{
    stats:       AnalyticsPageStats
    accuracy:    AccuracyDataPoint[]
    consistency: ConsistencyMonth
    difficulty:  DifficultyPerformance[]
    modes:       ModePerformance[]
    readiness:   OverallReadiness
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    const m = month ?? getCurrentMonth()
    analyticsApi.getAnalyticsPage(period, m)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [period, month])

  return { data, loading, error }
}
