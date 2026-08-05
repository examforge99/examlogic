// hooks/useSession.ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { sessionsApi } from '@/lib/api'
import type {
  Session,
  SessionMode,
  SessionConfig,
  Question,
} from '@/lib/types'

interface SessionState {
  session:         Session | null
  questions:       Question[]
  currentIndex:    number
  currentQuestion: Question | null
  answeredIds:     Set<string>
  score:           number
  isComplete:      boolean
  timeLeft:        number | null   // seconds, null if no timer
}

// ── Active session ────────────────────────────────────────────────────────

export function useSession(mode: SessionMode, config: SessionConfig) {
  const [state, setState] = useState<SessionState>({
    session:         null,
    questions:       [],
    currentIndex:    0,
    currentQuestion: null,
    answeredIds:     new Set(),
    score:           0,
    isComplete:      false,
    timeLeft:        null,
  })

  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Start session ──
  useEffect(() => {
    sessionsApi.start(mode, config)
      .then((data) => {
        const session   = data as Session & { questions: Question[] }
        const questions = session.questions ?? []
        const timeLimit = getTimeLimit(mode)

        setState(prev => ({
          ...prev,
          session,
          questions,
          currentQuestion: questions[0] ?? null,
          timeLeft: timeLimit,
        }))

        // Start countdown timer if mode has time limit
        if (timeLimit) {
          timerRef.current = setInterval(() => {
            setState(prev => {
              if (!prev.timeLeft) return prev
              if (prev.timeLeft <= 1) {
                clearInterval(timerRef.current!)
                return { ...prev, timeLeft: 0, isComplete: true }
              }
              return { ...prev, timeLeft: prev.timeLeft - 1 }
            })
          }, 1000)
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // ── Submit answer ──
  const submitAnswer = useCallback(async (
    selectedOptionId: string,
    timeSpentSeconds: number
  ) => {
    const { session, currentQuestion, questions, currentIndex } = state
    if (!session || !currentQuestion) return null

    try {
      const result = await sessionsApi.submitAnswer(
        session.id,
        currentQuestion.id,
        selectedOptionId,
        timeSpentSeconds
      )

      const isLast = currentIndex >= questions.length - 1

      setState(prev => {
        const newAnsweredIds = new Set(prev.answeredIds)
        newAnsweredIds.add(currentQuestion.id)

        return {
          ...prev,
          answeredIds:     newAnsweredIds,
          score:           result.isCorrect ? prev.score + 1 : prev.score,
          currentIndex:    isLast ? prev.currentIndex : prev.currentIndex + 1,
          currentQuestion: isLast ? prev.currentQuestion : questions[currentIndex + 1],
          isComplete:      isLast || (mode === 'suddendeath' && !result.isCorrect),
        }
      })

      return result
    } catch (e) {
      setError((e as Error).message)
      return null
    }
  }, [state, mode])

  // ── Next question ──
  const nextQuestion = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentIndex + 1
      if (nextIndex >= prev.questions.length) return prev
      return {
        ...prev,
        currentIndex:    nextIndex,
        currentQuestion: prev.questions[nextIndex],
      }
    })
  }, [])

  // ── Complete session ──
  const completeSession = useCallback(async () => {
    const { session } = state
    if (!session) return null

    try {
      const completed = await sessionsApi.complete(session.id)
      setState(prev => ({ ...prev, isComplete: true, session: completed }))
      if (timerRef.current) clearInterval(timerRef.current)
      return completed
    } catch (e) {
      setError((e as Error).message)
      return null
    }
  }, [state])

  // ── Abandon session ──
  const abandonSession = useCallback(async () => {
    const { session } = state
    if (!session) return

    try {
      await sessionsApi.abandon(session.id)
      if (timerRef.current) clearInterval(timerRef.current)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [state])

  return {
    ...state,
    loading,
    error,
    submitAnswer,
    nextQuestion,
    completeSession,
    abandonSession,
    progress: state.questions.length > 0
      ? Math.round((state.answeredIds.size / state.questions.length) * 100)
      : 0,
  }
}

// ── Recent sessions ───────────────────────────────────────────────────────

export function useRecentSessions(limit = 5) {
  const [data,    setData]    = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    sessionsApi.getRecent(limit)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [limit])

  return { data, loading, error }
}

// ── Session history ───────────────────────────────────────────────────────

export function useSessionHistory(mode?: SessionMode) {
  const [data,    setData]    = useState<Session[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    sessionsApi.getHistory(mode, page)
      .then(({ sessions, total }) => {
        setData(sessions)
        setTotal(total)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [mode, page])

  const nextPage = () => setPage(p => p + 1)
  const prevPage = () => setPage(p => Math.max(1, p - 1))

  return { data, total, page, loading, error, nextPage, prevPage }
}

// ── User progress ─────────────────────────────────────────────────────────

export function useProgress() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    progressApi.get()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getTimeLimit(mode: SessionMode): number | null {
  const limits: Partial<Record<SessionMode, number>> = {
    quickfire:  15 * 60,   // 15 minutes
    simulation: 120 * 60,  // 120 minutes
  }
  return limits[mode] ?? null
}

export function formatTimeLeft(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
