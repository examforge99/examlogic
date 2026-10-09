'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from 'lucide-react'

type Option = { id: string; option_text: string; position: number }
type Question = { id: string; subject_id: string; topic_id: string; question_text: string; setter_difficulty: number; options: Option[] }
type SessionPayload = { session_id: string; questions: Question[]; total_time_seconds: number }
type Result = { total_questions: number; correct_count: number; accuracy_percent: number; max_streak: number }

const C = { bg: '#F7F7F3', surface: '#FFFFFF', text: '#17232C', muted: '#687782', blue: '#0876B8', border: '#DCE4E8', green: '#087A5D' }

export default function QuickFireTestPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<SessionPayload | null>(null)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startedAt, setStartedAt] = useState<number>(Date.now())
  const [times, setTimes] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`examlogic:quick-fire:${params.id}`)
      if (raw) setSession(JSON.parse(raw) as SessionPayload)
    } catch {
      setError('This session could not be restored on this device.')
    }
  }, [params.id])

  const current = session?.questions?.[index]

  useEffect(() => {
    setStartedAt(Date.now())
  }, [current?.id])
  const answeredCount = Object.keys(answers).length
  const allAnswered = Boolean(session && session.questions.every(question => answers[question.id]))
  const progress = session?.questions?.length ? ((index + 1) / session.questions.length) * 100 : 0
  const optionLetters = useMemo(() => ['A', 'B', 'C', 'D', 'E', 'F'], [])

  function chooseOption(optionId: string) {
    if (!current || loading) return
    setAnswers(previous => ({ ...previous, [current.id]: optionId }))
    setTimes(previous => ({ ...previous, [current.id]: (previous[current.id] ?? 0) + Math.max(1, Math.floor((Date.now() - startedAt) / 1000)) }))
    setStartedAt(Date.now())
  }

  async function submitSession() {
    if (!session || loading) return
    setLoading(true)
    setError('')
    try {
      const payload = session.questions.filter(q => answers[q.id]).map(q => ({
        question_id: q.id,
        selected_option_id: answers[q.id],
        time_taken_seconds: times[q.id] ?? 0,
      }))
      if (payload.length !== session.questions.length) {
        setError('Answer every question before submitting so your score reflects the full session.')
        setLoading(false)
        return
      }
      const response = await fetch(`/api/sessions/quick-fire/${params.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Your answers could not be submitted.')
      try {
        localStorage.setItem('examlogic:campaign-unlocked', '1')
        sessionStorage.setItem('examlogic:show-campaign-unlock', '1')
        localStorage.setItem('examlogic:first-session-completed', '1')
      } catch {
        // Completion is still recorded server-side if browser storage is unavailable.
      }
      setResult(body as Result)
      sessionStorage.removeItem(`examlogic:quick-fire:${params.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: '28px 16px', display: 'grid', placeItems: 'center' }}>
      <section style={{ width: '100%', maxWidth: 460, background: C.surface, border: '1px solid ' + C.border, borderRadius: 20, padding: 24, textAlign: 'center' }}>
        <CheckCircle2 size={40} color={C.green} style={{ margin: '0 auto 14px' }} />
        <p style={{ color: C.muted, fontSize: 11, fontWeight: 800, letterSpacing: '.12em' }}>QUICK FIRE COMPLETE</p>
        <h1 style={{ fontSize: 28, margin: '8px 0' }}>{Math.round(result.accuracy_percent)}% accuracy</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>{result.correct_count} correct out of {result.total_questions} answered</p>
        <button onClick={() => router.push('/dashboard')} style={{ width: '100%', marginTop: 20, padding: 14, border: 0, borderRadius: 11, background: C.blue, color: 'white', fontWeight: 750 }}>Back to dashboard</button>
      </section>
    </main>
  }

  if (!session) {
    return <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: 24, display: 'grid', placeItems: 'center' }}>
      <section style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22 }}>Session unavailable</h1>
        <p style={{ color: C.muted, lineHeight: 1.6 }}>{error || 'This Quick Fire session could not be found in this browser. Start a new session to continue.'}</p>
        <button onClick={() => router.push('/quick-fire')} style={{ padding: '12px 16px', border: 0, borderRadius: 10, background: C.blue, color: '#fff', fontWeight: 700 }}>Start a new session</button>
      </section>
    </main>
  }

  if (!current) return null

  return <main style={{ minHeight: '100svh', background: C.bg, color: C.text, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
    <header style={{ position: 'sticky', top: 0, zIndex: 5, background: 'rgba(247,247,243,.96)', borderBottom: '1px solid ' + C.border, padding: '13px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button aria-label="Exit Quick Fire" onClick={() => router.push('/dashboard')} style={{ border: '1px solid ' + C.border, background: C.surface, borderRadius: 10, width: 38, height: 38, display: 'grid', placeItems: 'center' }}><ArrowLeft size={17}/></button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, fontWeight: 750 }}><span>Quick Fire</span><span>{index + 1} / {session.questions.length}</span></div>
          <div style={{ height: 4, background: '#E3EAED', borderRadius: 9, overflow: 'hidden', marginTop: 8 }}><div style={{ height: '100%', width: progress + '%', background: C.blue, transition: 'width .2s ease' }}/></div>
        </div>
      </div>
    </header>
    <section style={{ maxWidth: 680, margin: '0 auto', padding: '25px 16px' }}>
      <p style={{ color: C.blue, fontSize: 10, fontWeight: 800, letterSpacing: '.12em' }}>QUESTION {index + 1}</p>
      <h1 style={{ fontSize: 21, lineHeight: 1.45, letterSpacing: '-.02em', margin: '8px 0 18px', whiteSpace: 'pre-wrap' }}>{current.question_text}</h1>
      <div style={{ display: 'grid', gap: 10 }}>
        {current.options?.map((option, i) => {
          const selected = answers[current.id] === option.id
          return <button key={option.id} onClick={() => chooseOption(option.id)} aria-pressed={selected} style={{ width: '100%', display: 'flex', alignItems: 'start', gap: 12, padding: 14, textAlign: 'left', border: '1px solid ' + (selected ? C.blue : C.border), borderRadius: 13, background: selected ? '#E8F4FA' : C.surface, color: C.text }}>
            <span style={{ width: 28, height: 28, flex: '0 0 28px', borderRadius: 8, display: 'grid', placeItems: 'center', background: selected ? C.blue : '#EDF1F3', color: selected ? '#fff' : C.muted, fontWeight: 800, fontSize: 12 }}>{optionLetters[i] || i + 1}</span>
            <span style={{ fontSize: 14, lineHeight: 1.5, paddingTop: 4 }}>{option.option_text}</span>
          </button>
        })}
      </div>
      {error && <p role="alert" style={{ color: '#B42318', fontSize: 13, marginTop: 14 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        <button disabled={index === 0 || loading} onClick={() => { setIndex(i => i - 1); setStartedAt(Date.now()) }} style={{ flex: 1, padding: 13, border: '1px solid ' + C.border, borderRadius: 11, background: C.surface, color: C.text, fontWeight: 700 }}>Previous</button>
        {index < session.questions.length - 1
          ? <button disabled={!answers[current.id] || loading} onClick={() => { setIndex(i => i + 1); setStartedAt(Date.now()) }} style={{ flex: 1, padding: 13, border: 0, borderRadius: 11, background: C.blue, color: '#fff', fontWeight: 750, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, opacity: !answers[current.id] || loading ? .55 : 1 }}>Next <ArrowRight size={15}/></button>
          : <button disabled={!allAnswered || loading} onClick={submitSession} style={{ flex: 1, padding: 13, border: 0, borderRadius: 11, background: C.green, color: '#fff', fontWeight: 750, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, opacity: !allAnswered || loading ? .55 : 1 }}>{loading ? <><LoaderCircle size={15}/> Submitting</> : `Submit (${answeredCount})`}</button>}
      </div>
      <p style={{ color: C.muted, fontSize: 11, marginTop: 14, textAlign: 'center' }}>Your answers are submitted securely for scoring.</p>
    </section>
  </main>
}
