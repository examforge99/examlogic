'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Flame, LoaderCircle, Zap } from 'lucide-react'

type Option = { id: string; option_text: string; position: number }
type Question = {
  id: string
  question_text: string
  difficulty_level: number
  resolved_question_type: string
  question_options: Option[]
}
type Challenge = {
  session_id: string
  nonce: string
  time_limit_seconds: number
  current_difficulty_band: number
  current_streak: number
  question: Question
}
type AnswerResult = {
  status: 'continue' | 'ended'
  nonce?: string
  time_limit_seconds?: number
  current_difficulty_band?: number
  current_streak?: number
  leveled_up?: boolean
  question?: Question
  result?: Record<string, unknown>
  timed_out?: boolean
  reason?: string
}

const C = {
  bg: '#F7F7F3',
  surface: '#FFFFFF',
  text: '#17232C',
  muted: '#687782',
  blue: '#0876B8',
  border: '#DCE4E8',
  orange: '#B45309',
  green: '#087A5D',
  red: '#B42318',
}

export default function SuddenDeathChallengePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [selected, setSelected] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [finished, setFinished] = useState<AnswerResult | null>(null)
  const [showLevelUp, setShowLevelUp] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`examlogic:sudden-death:${params.id}`)
      if (!raw) {
        setError('This challenge could not be restored on this device. Start a new run.')
        return
      }
      const saved = JSON.parse(raw) as Challenge
      if (!saved.session_id || !saved.nonce || !saved.question) {
        setError('The saved challenge data is incomplete. Start a new run.')
        return
      }
      setChallenge(saved)
      setSeconds(saved.time_limit_seconds)
    } catch {
      setError('This challenge could not be restored on this device. Start a new run.')
    }
  }, [params.id])

  const submitAnswer = useCallback(async (optionId?: string) => {
    if (!challenge || submitting || finished) return
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/sessions/sudden-death/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: challenge.session_id,
          selected_option_id: optionId || selected || 'timeout',
          nonce: challenge.nonce,
        }),
      })
      const body = await response.json() as AnswerResult & { error?: string }
      if (!response.ok) throw new Error(body.error || 'Your answer could not be submitted.')
      if (body.status === 'ended') {
        setFinished(body)
        sessionStorage.removeItem(`examlogic:sudden-death:${params.id}`)
        return
      }
      if (!body.question || !body.nonce) throw new Error('The next question could not be loaded.')
      const next: Challenge = {
        ...challenge,
        nonce: body.nonce,
        time_limit_seconds: body.time_limit_seconds ?? 15,
        current_difficulty_band: body.current_difficulty_band ?? challenge.current_difficulty_band,
        current_streak: body.current_streak ?? 0,
        question: body.question,
      }
      setChallenge(next)
      sessionStorage.setItem(`examlogic:sudden-death:${params.id}`, JSON.stringify(next))
      setSelected('')
      setSeconds(next.time_limit_seconds)
      setShowLevelUp(Boolean(body.leveled_up))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }, [challenge, finished, params.id, selected, submitting])

  useEffect(() => {
    if (!challenge || finished || submitting || seconds <= 0) return
    const timer = window.setTimeout(() => setSeconds(value => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [challenge, finished, seconds, submitting])

  useEffect(() => {
    if (challenge && seconds <= 0 && !finished && !submitting) void submitAnswer('timeout')
  }, [challenge, finished, seconds, submitting, submitAnswer])

  if (finished) {
    const summary = finished.result || {}
    const correct = summary.correct_count ?? summary.correctCount
    const questions = summary.total_questions ?? summary.totalQuestions
    const streak = summary.max_streak ?? summary.maxStreak
    const stats: { label: string; value: string | number }[] = [
      { label: 'Correct', value: typeof correct === 'number' ? correct : '—' },
      { label: 'Questions', value: typeof questions === 'number' ? questions : '—' },
      { label: 'Best streak', value: typeof streak === 'number' ? streak : '—' },
    ]
    return (
      <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: '28px 16px', display: 'grid', placeItems: 'center' }}>
        <section style={{ width: '100%', maxWidth: 460, padding: 24, borderRadius: 20, border: '1px solid ' + C.border, background: C.surface, textAlign: 'center' }}>
          <CheckCircle2 size={42} color={C.green} style={{ margin: '0 auto 12px' }} />
          <p style={{ margin: 0, color: C.orange, fontSize: 10, fontWeight: 800, letterSpacing: '.12em' }}>SUDDEN DEATH RUN ENDED</p>
          <h1 style={{ margin: '9px 0', fontSize: 27, letterSpacing: '-.04em' }}>{finished.timed_out ? 'Time ran out' : 'Run complete'}</h1>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>Your run has been recorded. Review your progress and take another challenge when you’re ready.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 20 }}>
            {stats.map(({ label, value }) => (
              <div key={label} style={{ padding: 12, borderRadius: 12, background: C.bg, border: '1px solid ' + C.border }}>
                <strong style={{ display: 'block', fontSize: 18 }}>{String(value)}</strong>
                <span style={{ display: 'block', marginTop: 4, color: C.muted, fontSize: 10 }}>{label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => router.push('/sudden-death')} style={{ width: '100%', marginTop: 18, padding: 13, border: 0, borderRadius: 11, background: C.blue, color: '#fff', fontWeight: 750 }}>Start another run</button>
          <button onClick={() => router.push('/dashboard')} style={{ width: '100%', marginTop: 9, padding: 12, border: '1px solid ' + C.border, borderRadius: 11, background: C.surface, color: C.text, fontWeight: 700 }}>Back to dashboard</button>
        </section>
      </main>
    )
  }

  if (!challenge) {
    return (
      <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: 24, display: 'grid', placeItems: 'center' }}>
        <section style={{ maxWidth: 420, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22 }}>Challenge unavailable</h1>
          <p style={{ color: C.muted, lineHeight: 1.6 }}>{error || 'Loading your question…'}</p>
          <button onClick={() => router.push('/sudden-death')} style={{ padding: '12px 16px', border: 0, borderRadius: 10, background: C.blue, color: '#fff', fontWeight: 700 }}>Start a new run</button>
        </section>
      </main>
    )
  }

  const question = challenge.question
  const progress = Math.max(0, Math.min(100, seconds / Math.max(1, challenge.time_limit_seconds) * 100))

  return (
    <main style={{ minHeight: '100svh', background: C.bg, color: C.text, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(247,247,243,.96)', borderBottom: '1px solid ' + C.border, padding: '13px 16px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button aria-label="Exit challenge" onClick={() => router.push('/dashboard')} style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 10, border: '1px solid ' + C.border, background: C.surface, color: C.text }}><ArrowLeft size={17}/></button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, fontWeight: 750 }}><span>Sudden Death</span><span>Level {challenge.current_difficulty_band}</span></div>
            <div style={{ height: 4, background: '#E3EAED', borderRadius: 9, overflow: 'hidden', marginTop: 8 }}><div style={{ height: '100%', width: progress + '%', background: seconds <= 5 ? C.red : C.blue, transition: 'width .2s ease' }}/></div>
          </div>
          <div style={{ minWidth: 48, display: 'flex', alignItems: 'center', justifyContent: 'end', gap: 5, color: seconds <= 5 ? C.red : C.text, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}><Clock3 size={15}/>{seconds}s</div>
        </div>
      </header>
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
          <span style={{ color: C.orange, fontSize: 10, fontWeight: 800, letterSpacing: '.12em' }}>ONE WRONG ANSWER ENDS THE RUN</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: C.muted, fontSize: 11 }}><Flame size={14} color={C.orange}/>{challenge.current_streak} streak</span>
        </div>
        {showLevelUp && <div role="status" style={{ marginBottom: 14, padding: 12, borderRadius: 11, background: '#E4F5EE', color: C.green, fontSize: 13, fontWeight: 750 }}><Zap size={15} style={{ verticalAlign: 'middle', marginRight: 6 }}/>Level up! The next question is harder.</div>}
        <h1 style={{ margin: '0 0 20px', fontSize: 21, lineHeight: 1.5, letterSpacing: '-.02em', whiteSpace: 'pre-wrap' }}>{question.question_text}</h1>
        <div style={{ display: 'grid', gap: 10 }}>
          {(question.question_options || []).map((option, index) => {
            const chosen = selected === option.id
            return <button key={option.id} disabled={submitting} onClick={() => setSelected(option.id)} aria-pressed={chosen} style={{ width: '100%', display: 'flex', alignItems: 'start', gap: 12, padding: 14, textAlign: 'left', border: '1px solid ' + (chosen ? C.blue : C.border), borderRadius: 13, background: chosen ? '#E8F4FA' : C.surface, color: C.text, opacity: submitting ? .7 : 1 }}>
              <span style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: 8, display: 'grid', placeItems: 'center', background: chosen ? C.blue : '#EDF1F3', color: chosen ? '#fff' : C.muted, fontWeight: 800, fontSize: 12 }}>{String.fromCharCode(65 + index)}</span>
              <span style={{ fontSize: 14, lineHeight: 1.5, paddingTop: 4 }}>{option.option_text}</span>
            </button>
          })}
        </div>
        {error && <p role="alert" style={{ marginTop: 14, color: C.red, fontSize: 13 }}>{error}</p>}
        <button disabled={!selected || submitting} onClick={() => void submitAnswer(selected)} style={{ width: '100%', marginTop: 22, padding: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, border: 0, borderRadius: 11, background: C.blue, color: '#fff', fontWeight: 750, opacity: !selected || submitting ? .55 : 1 }}>
          {submitting ? <><LoaderCircle size={16}/> Checking answer</> : <>Lock answer <ArrowRight size={15}/></>}
        </button>
      </section>
    </main>
  )
}
