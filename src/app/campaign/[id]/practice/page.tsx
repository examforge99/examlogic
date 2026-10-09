'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'

type Option = { id: string; option_text: string; position: number }
type Question = { id: string; subject_id: string; topic_id: string; question_text: string; setter_difficulty: number; options: Option[] }
type CampaignSession = { session_id: string; questions: Question[]; total_questions: number; is_timed: boolean; time_limit_seconds: number | null; started_at: string; expires_at?: string | null }
type Summary = { total_questions: number; correct_count: number; accuracy_percent: number; total_time_seconds: number }
type Submission = { session_completed: boolean; session_summary: Summary | null; error?: string }

const C = { bg: '#F7F7F3', surface: '#FFFFFF', text: '#17232C', muted: '#687782', blue: '#0876B8', border: '#DCE4E8', green: '#087A5D', red: '#B42318' }

export default function CampaignPracticePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<CampaignSession | null>(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startedAt, setStartedAt] = useState(Date.now())
  const [times, setTimes] = useState<Record<string, number>>({})
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [expiryHandled, setExpiryHandled] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`examlogic:campaign:${params.id}`)
      if (!raw) {
        setError('This session could not be restored on this device. Return to Campaign and start again.')
        return
      }
      const saved = JSON.parse(raw) as CampaignSession
      if (saved.session_id !== params.id || !Array.isArray(saved.questions) || !saved.questions.length) {
        setError('The saved session data is incomplete. Start a new Campaign session.')
        return
      }
      setSession(saved)
      setSecondsLeft(saved.is_timed
        ? saved.expires_at
          ? Math.max(0, Math.ceil((new Date(saved.expires_at).getTime() - Date.now()) / 1000))
          : saved.time_limit_seconds ?? null
        : null)
    } catch {
      setError('This session could not be restored on this device. Return to Campaign and start again.')
    }
  }, [params.id])

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0 || summary || loading) return
    const timer = window.setTimeout(() => setSecondsLeft(value => value === null ? null : Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft, summary, loading])

  const current = session?.questions[index]
  const answeredCount = Object.keys(answers).length
  const progress = session?.questions.length ? ((index + 1) / session.questions.length) * 100 : 0
  const allAnswered = Boolean(session && session.questions.every(question => answers[question.id]))

  function chooseOption(optionId: string) {
    if (!current || loading) return
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
    setAnswers(previous => ({ ...previous, [current.id]: optionId }))
    setTimes(previous => ({ ...previous, [current.id]: (previous[current.id] ?? 0) + elapsed }))
    setStartedAt(Date.now())
  }

  async function submitSession() {
    if (!session || loading || !allAnswered) {
      setError('Answer every question before submitting your Campaign.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = session.questions.map(question => ({
        question_id: question.id,
        selected_option_id: answers[question.id],
        time_taken_seconds: times[question.id] ?? 0,
      }))
      const response = await fetch(`/api/sessions/campaign/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      })
      const body = await response.json() as Submission
      if (!response.ok) throw new Error(body.error || 'Your answers could not be submitted.')
      if (!body.session_summary) throw new Error('Your session was submitted, but the result summary was not returned.')
      setSummary(body.session_summary)
      sessionStorage.removeItem(`examlogic:campaign:${params.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (secondsLeft === 0 && session && !summary && !loading && !expiryHandled) {
      // Campaign's submit endpoint requires an answer for every submitted question.
      // If the timer expires, submit only the answered questions as a bulk attempt.
      const submitExpired = async () => {
        setLoading(true)
        setError('')
        try {
          const payload = session.questions.filter(question => answers[question.id]).map(question => ({
            question_id: question.id,
            selected_option_id: answers[question.id],
            time_taken_seconds: times[question.id] ?? 0,
          }))
          const response = await fetch(`/api/sessions/campaign/${params.id}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: payload, force_close: true }),
          })
          const body = await response.json() as Submission
          if (!response.ok) throw new Error(body.error || 'The timed session could not be submitted.')
          if (body.session_summary) {
            setSummary(body.session_summary)
            sessionStorage.removeItem(`examlogic:campaign:${params.id}`)
          } else throw new Error('The timed session ended without a result summary.')
        } catch (e) {
          setError(e instanceof Error ? e.message : 'The timed session could not be submitted.')
        } finally {
          setLoading(false)
        }
      }
      setExpiryHandled(true)
      void submitExpired()
    }
  }, [secondsLeft, session, summary, loading, answers, times, params.id, expiryHandled])

  if (summary) {
    return <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: '28px 16px', display: 'grid', placeItems: 'center' }}>
      <section style={{ width: '100%', maxWidth: 460, padding: 24, borderRadius: 20, border: '1px solid ' + C.border, background: C.surface, textAlign: 'center' }}>
        <CheckCircle2 size={42} color={C.green} style={{ margin: '0 auto 12px' }}/>
        <p style={{ margin: 0, color: C.blue, fontSize: 10, fontWeight: 800, letterSpacing: '.12em' }}>CAMPAIGN COMPLETE</p>
        <h1 style={{ margin: '9px 0', fontSize: 28, letterSpacing: '-.04em' }}>{Math.round(summary.accuracy_percent)}% accuracy</h1>
        <p style={{ color: C.muted, fontSize: 13 }}>{summary.correct_count} correct out of {summary.total_questions} questions</p>
        <button onClick={() => router.push('/analytics')} style={{ width: '100%', marginTop: 18, padding: 13, border: 0, borderRadius: 11, background: C.blue, color: '#fff', fontWeight: 750 }}>View analytics</button>
        <button onClick={() => router.push('/practice')} style={{ width: '100%', marginTop: 9, padding: 12, border: '1px solid ' + C.border, borderRadius: 11, background: C.surface, color: C.text, fontWeight: 700 }}>Choose another mode</button>
      </section>
    </main>
  }

  if (!session || !current) {
    return <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: 24, display: 'grid', placeItems: 'center' }}>
      <section style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Campaign unavailable</h1>
        <p style={{ color: C.muted, lineHeight: 1.6 }}>{error || 'Loading your questions…'}</p>
        <button onClick={() => router.push('/campaign')} style={{ padding: '12px 16px', border: 0, borderRadius: 10, background: C.blue, color: '#fff', fontWeight: 700 }}>Back to Campaign</button>
      </section>
    </main>
  }

  return <main style={{ minHeight: '100svh', background: C.bg, color: C.text, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
    <header style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(247,247,243,.96)', borderBottom: '1px solid ' + C.border, padding: '13px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button aria-label="Exit Campaign" onClick={() => router.push('/practice')} style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 10, border: '1px solid ' + C.border, background: C.surface, color: C.text }}><ArrowLeft size={17}/></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, fontWeight: 750 }}><span>Campaign</span><span>{index + 1} / {session.questions.length}</span></div>
          <div style={{ height: 4, background: '#E3EAED', borderRadius: 9, overflow: 'hidden', marginTop: 8 }}><div style={{ height: '100%', width: progress + '%', background: C.blue, transition: 'width .2s ease' }}/></div>
        </div>
        {secondsLeft !== null && <span style={{ minWidth: 48, color: secondsLeft <= 30 ? C.red : C.text, fontSize: 12, fontWeight: 800, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span>}
      </div>
    </header>
    <section style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
      <p style={{ color: C.blue, fontSize: 10, fontWeight: 800, letterSpacing: '.12em' }}>QUESTION {index + 1}</p>
      <h1 style={{ margin: '8px 0 20px', fontSize: 21, lineHeight: 1.5, letterSpacing: '-.02em', whiteSpace: 'pre-wrap' }}>{current.question_text}</h1>
      <div style={{ display: 'grid', gap: 10 }}>
        {(current.options || []).map((option, optionIndex) => {
          const chosen = answers[current.id] === option.id
          return <button key={option.id} onClick={() => chooseOption(option.id)} disabled={loading} aria-pressed={chosen} style={{ width: '100%', display: 'flex', alignItems: 'start', gap: 12, padding: 14, textAlign: 'left', border: '1px solid ' + (chosen ? C.blue : C.border), borderRadius: 13, background: chosen ? '#E8F4FA' : C.surface, color: C.text }}>
            <span style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: 8, display: 'grid', placeItems: 'center', background: chosen ? C.blue : '#EDF1F3', color: chosen ? '#fff' : C.muted, fontWeight: 800, fontSize: 12 }}>{String.fromCharCode(65 + optionIndex)}</span>
            <span style={{ fontSize: 14, lineHeight: 1.5, paddingTop: 4 }}>{option.option_text}</span>
          </button>
        })}
      </div>
      {error && <p role="alert" style={{ marginTop: 14, color: C.red, fontSize: 13 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button disabled={index === 0 || loading} onClick={() => { setIndex(value => value - 1); setStartedAt(Date.now()) }} style={{ flex: 1, padding: 13, border: '1px solid ' + C.border, borderRadius: 11, background: C.surface, color: C.text, fontWeight: 700 }}>Previous</button>
        {index < session.questions.length - 1
          ? <button disabled={!answers[current.id] || loading} onClick={() => { setIndex(value => value + 1); setStartedAt(Date.now()) }} style={{ flex: 1, padding: 13, border: 0, borderRadius: 11, background: C.blue, color: '#fff', fontWeight: 750, opacity: !answers[current.id] || loading ? .55 : 1 }}>Next <ArrowRight size={15} style={{ verticalAlign: 'middle' }}/></button>
          : <button disabled={!allAnswered || loading} onClick={() => void submitSession()} style={{ flex: 1, padding: 13, border: 0, borderRadius: 11, background: C.green, color: '#fff', fontWeight: 750, opacity: !allAnswered || loading ? .55 : 1 }}>{loading ? <><LoaderCircle size={15} style={{ verticalAlign: 'middle' }}/> Submitting</> : 'Submit campaign'}</button>}
      </div>
      <p style={{ color: C.muted, fontSize: 11, marginTop: 14, textAlign: 'center' }}>{answeredCount} of {session.questions.length} answered</p>
    </section>
  </main>
}
