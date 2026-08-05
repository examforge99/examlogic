// lib/api.ts

import {
  AccuracyDataPoint,
  AnalyticsPeriod,
  AnalyticsPageStats,
  ConsistencyMonth,
  DifficultyPerformance,
  DifficultyLevel,
  ModePerformance,
  OverallReadiness,
  Session,
  SessionAnswer,
  SessionConfig,
  SessionMode,
  Subject,
  SubjectPerformance,
  Topic,
  TopicPerformance,
  UserProgress,
  ApiResult,
  DIFFICULTY_LABELS,
} from '@lib/types'

// ── Base fetch ────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message ?? `API error ${res.status}`)
  }

  const { data, error }: ApiResult<T> = await res.json()
  if (error) throw new Error(error.message)
  return data as T
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message ?? `API error ${res.status}`)
  }

  const { data, error }: ApiResult<T> = await res.json()
  if (error) throw new Error(error.message)
  return data as T
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }))
    throw new Error(error.message ?? `API error ${res.status}`)
  }

  const { data, error }: ApiResult<T> = await res.json()
  if (error) throw new Error(error.message)
  return data as T
}

// ── Subjects ──────────────────────────────────────────────────────────────

export const subjectsApi = {
  // Get all subjects
  getAll: () =>
    get<Subject[]>('/subjects'),

  // Get single subject by slug
  getBySlug: (slug: string) =>
    get<Subject>(`/subjects/${slug}`),

  // Get all topics for a subject
  getTopics: (subjectId: string) =>
    get<Topic[]>(`/subjects/${subjectId}/topics`),

  // Get topic performance for a subject
  getTopicPerformance: (subjectId: string) =>
    get<TopicPerformance[]>(`/subjects/${subjectId}/performance`),

  // Get subject performance summary (all subjects)
  getPerformance: () =>
    get<SubjectPerformance[]>('/subjects/performance'),
}

// ── Sessions ──────────────────────────────────────────────────────────────

export const sessionsApi = {
  // Start a new session
  start: (mode: SessionMode, config: SessionConfig) =>
    post<Session>('/sessions/start', { mode, config }),

  // Submit a single answer
  submitAnswer: (
    sessionId: string,
    questionId: string,
    selectedOptionId: string,
    timeSpentSeconds: number
  ) =>
    post<SessionAnswer>(`/sessions/${sessionId}/answer`, {
      questionId,
      selectedOptionId,
      timeSpentSeconds,
    }),

  // Complete a session
  complete: (sessionId: string) =>
    patch<Session>(`/sessions/${sessionId}/complete`, {}),

  // Abandon a session
  abandon: (sessionId: string) =>
    patch<Session>(`/sessions/${sessionId}/abandon`, {}),

  // Get recent sessions
  getRecent: (limit = 5) =>
    get<Session[]>(`/sessions/recent?limit=${limit}`),

  // Get session history with optional mode filter
  getHistory: (mode?: SessionMode, page = 1, limit = 20) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(mode && { mode }),
    })
    return get<{ sessions: Session[]; total: number }>(`/sessions/history?${params}`)
  },

  // Get single session with answers
  getById: (sessionId: string) =>
    get<Session & { answers: SessionAnswer[] }>(`/sessions/${sessionId}`),
}

// ── Analytics ─────────────────────────────────────────────────────────────

export const analyticsApi = {
  // Top stat row — total questions, avg accuracy, streak, study time
  getPageStats: () =>
    get<AnalyticsPageStats>('/analytics/stats'),

  // Accuracy trend — 7 days (daily), 30 days (weekly), 90 days (monthly)
  getAccuracyTrend: (period: AnalyticsPeriod) =>
    get<AccuracyDataPoint[]>(`/analytics/accuracy?period=${period}`),

  // Consistency heatmap for a given month
  getConsistency: (month: string) =>
    get<ConsistencyMonth>(`/analytics/consistency?month=${month}`),

  // Difficulty performance across all levels
  getDifficultyPerformance: () =>
    get<DifficultyPerformance[]>('/analytics/difficulty'),

  // Practice mode performance
  getModePerformance: () =>
    get<ModePerformance[]>('/analytics/modes'),

  // Overall readiness score + unlock status
  getOverallReadiness: () =>
    get<OverallReadiness>('/analytics/readiness'),

  // Parallel fetch for full analytics page
  getAnalyticsPage: (period: AnalyticsPeriod, month: string) =>
    Promise.all([
      analyticsApi.getPageStats(),
      analyticsApi.getAccuracyTrend(period),
      analyticsApi.getConsistency(month),
      analyticsApi.getDifficultyPerformance(),
      analyticsApi.getModePerformance(),
      analyticsApi.getOverallReadiness(),
    ]).then(([stats, accuracy, consistency, difficulty, modes, readiness]) => ({
      stats,
      accuracy,
      consistency,
      difficulty,
      modes,
      readiness,
    })),
}

// ── User Progress ─────────────────────────────────────────────────────────

export const progressApi = {
  // Get user progress — current level, points, next threshold
  get: () =>
    get<UserProgress>('/progress'),
}

// ── Dashboard ─────────────────────────────────────────────────────────────

export const dashboardApi = {
  // Parallel fetch for full dashboard
  getDashboard: () =>
    Promise.all([
      sessionsApi.getRecent(4),
      analyticsApi.getPageStats(),
      subjectsApi.getPerformance(),
      progressApi.get(),
    ]).then(([recentSessions, stats, subjects, progress]) => ({
      recentSessions,
      stats,
      subjects,
      progress,
    })),
}

// ── Helpers ───────────────────────────────────────────────────────────────

// Get accuracy color based on value
export function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return '#25d6a2'
  if (accuracy >= 65) return '#3FB7FF'
  if (accuracy >= 50) return '#ff8c55'
  return '#ff6b6b'
}

// Get difficulty label from level
export function getDifficultyLabel(level: DifficultyLevel): string {
  return DIFFICULTY_LABELS[level]
}

// Format study time from minutes
export function formatStudyTime(mins: number): string {
  if (mins === 0) return '0m'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// Format large numbers
export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// Get relative time string
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

// Get consistency level from questions answered
export function getConsistencyLevel(questions: number): 0 | 1 | 2 | 3 | 4 {
  if (questions === 0)  return 0
  if (questions <= 20)  return 1
  if (questions <= 45)  return 2
  if (questions <= 70)  return 3
  return 4
}

// Get current month string YYYY-MM
export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Get date range label for a period
export function getPeriodLabel(period: AnalyticsPeriod): string {
  const labels: Record<AnalyticsPeriod, string> = {
    '7':  'Last 7 Days',
    '30': 'Last 30 Days',
    '90': 'Last 90 Days',
  }
  return labels[period]
}
