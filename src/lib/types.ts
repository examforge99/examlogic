// lib/types.ts

// ── Subjects & Topics ──────────────────────────────────────────────────────

export interface Subject {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  totalTopics: number
  createdAt: string
}

export interface Topic {
  id: string
  subjectId: string
  name: string
  slug: string
  description?: string
  difficultyLevel: DifficultyLevel
  totalQuestions: number
  createdAt: string
}

// ── Questions ──────────────────────────────────────────────────────────────

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

export interface Question {
  id: string
  subjectId: string
  topicId: string
  text: string
  options: QuestionOption[]
  correctOptionId: string
  explanation?: string
  difficultyLevel: DifficultyLevel
  year?: number
  createdAt: string
}

export interface QuestionOption {
  id: string
  text: string
}

// ── Sessions ───────────────────────────────────────────────────────────────

export type SessionMode =
  | 'quickfire'
  | 'campaign'
  | 'simulation'
  | 'suddendeath'

export type SessionStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'abandoned'

export interface Session {
  id: string
  userId: string
  mode: SessionMode
  status: SessionStatus
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  score: number
  durationSeconds: number
  pointsEarned: number
  subjectId?: string
  startedAt: string
  completedAt?: string
  createdAt: string
}

export interface SessionAnswer {
  id: string
  sessionId: string
  questionId: string
  selectedOptionId: string
  isCorrect: boolean
  timeSpentSeconds: number
  createdAt: string
}

export interface SessionConfig {
  totalQuestions?: number
  timeLimitMins?: number
  subjectId?: string
  level?: number
}

// ── Analytics ──────────────────────────────────────────────────────────────

export type AnalyticsPeriod = '7' | '30' | '90'

export interface AnalyticsPageStats {
  totalQuestions: number
  avgAccuracy: number
  currentStreak: number
  totalStudyTimeMins: number
}

export interface AccuracyDataPoint {
  date: string
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  label: string
  sublabel: string
}

export interface ConsistencyDay {
  date: string
  totalQuestions: number
  studyTimeMins: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface ConsistencyMonth {
  month: string
  days: ConsistencyDay[]
  currentStreak: number
  bestStreak: number
  activeDays: number
  totalDays: number
}

export interface DifficultyPerformance {
  difficultyLevel: DifficultyLevel
  label: string
  totalQuestions: number
  correctAnswers: number
  accuracy: number
}

export interface ModePerformance {
  mode: SessionMode
  sessionsCount: number
  totalQuestions: number
  accuracy: number
  bestScore: number
  studyTimeMins: number
  lastPlayed: string
}

export interface SubjectPerformance {
  subjectId: string
  name: string
  slug: string
  color: string
  icon: string
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  accuracyDelta: number
  studyTimeMins: number
  weakestTopic?: TopicPerformance
  strongestTopic?: TopicPerformance
}

export interface TopicPerformance {
  topicId: string
  name: string
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  lastPracticed: string
}

export interface OverallReadiness {
  score: number
  isUnlocked: boolean
  unlockProgress: {
    sessionsCompleted: number
    sessionsRequired: number
    subjectsCovered: number
    subjectsRequired: number
    daysOnPlatform: number
    daysRequired: number
  }
}

// ── User Progress ──────────────────────────────────────────────────────────

export type DifficultyLabel =
  | 'Very Easy'
  | 'Easy'
  | 'Medium'
  | 'Hard'
  | 'Very Hard'

export interface UserProgress {
  id: string
  userId: string
  currentLevel: DifficultyLevel
  currentLevelLabel: DifficultyLabel
  currentPoints: number
  pointsToNextLevel: number
  nextLevelThreshold: number
  totalPointsEarned: number
  createdAt: string
  updatedAt: string
}

// ── API Response wrappers ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    message: string
    code?: string
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// ── Constants ──────────────────────────────────────────────────────────────

export const DIFFICULTY_LABELS: Record<DifficultyLevel, DifficultyLabel> = {
  1: 'Very Easy',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Very Hard',
}

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  1: '#25d6a2',
  2: '#25d6a2',
  3: '#3FB7FF',
  4: '#ff8c55',
  5: '#ff6b6b',
}

export const MODE_CONFIG = {
  quickfire: {
    label:  'Quick Fire',
    icon:   '⚡',
    color:  '#3FB7FF',
    bg:     '#3FB7FF18',
    border: '#3FB7FF30',
  },
  campaign: {
    label:  'Campaign',
    icon:   '🎯',
    color:  '#a78bfa',
    bg:     '#a78bfa18',
    border: '#a78bfa30',
  },
  simulation: {
    label:  'JAMB Simulation',
    icon:   '📋',
    color:  '#25d6a2',
    bg:     '#25d6a218',
    border: '#25d6a230',
  },
  suddendeath: {
    label:  'Sudden Death',
    icon:   '💀',
    color:  '#ff6b6b',
    bg:     '#ff6b6b18',
    border: '#ff6b6b30',
  },
} as const

export const SUBJECT_COLORS: Record<string, {
  color: string
  bg: string
  border: string
}> = {
  maths:     { color: '#a78bfa', bg: '#a78bfa18', border: '#a78bfa30' },
  english:   { color: '#3FB7FF', bg: '#3FB7FF18', border: '#3FB7FF30' },
  physics:   { color: '#25d6a2', bg: '#25d6a218', border: '#25d6a230' },
  chemistry: { color: '#ff8c55', bg: '#ff8c5518', border: '#ff8c5530' },
}
