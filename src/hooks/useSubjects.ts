// hooks/useSubjects.ts
'use client'

import { useState, useEffect } from 'react'
import { subjectsApi } from '@/lib/api'
import type {
  Subject,
  Topic,
  SubjectPerformance,
  TopicPerformance,
} from '@/lib/types'

// ── All subjects ──────────────────────────────────────────────────────────

export function useSubjects() {
  const [data,    setData]    = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    subjectsApi.getAll()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

// ── Single subject ────────────────────────────────────────────────────────

export function useSubject(slug: string) {
  const [data,    setData]    = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    subjectsApi.getBySlug(slug)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [slug])

  return { data, loading, error }
}

// ── Topics for a subject ──────────────────────────────────────────────────

export function useTopics(subjectId: string) {
  const [data,    setData]    = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!subjectId) return
    subjectsApi.getTopics(subjectId)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [subjectId])

  return { data, loading, error }
}

// ── Subject performance (all subjects) ───────────────────────────────────

export function useSubjectPerformance() {
  const [data,    setData]    = useState<SubjectPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    subjectsApi.getPerformance()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}

// ── Topic performance for a subject ──────────────────────────────────────

export function useTopicPerformance(subjectId: string) {
  const [data,    setData]    = useState<TopicPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!subjectId) return
    subjectsApi.getTopicPerformance(subjectId)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [subjectId])

  // Derived — sorted by accuracy ascending (weakest first)
  const weakest  = [...data].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3)
  const strongest = [...data].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3)

  return { data, loading, error, weakest, strongest }
}
