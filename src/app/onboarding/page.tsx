'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, CalendarDays, Check, Clock3, LoaderCircle } from 'lucide-react'

type Subject = { id: string; name: string; slug: string }
type CurrentProfile = {
  exam_date: string | null
  study_days: string[] | null
  daily_hours: number | null
  subject_ids: string[] | null
  timetable_created: boolean
}
type OnboardingResponse = {
  subjects: Subject[]
  constraints: { required_subject_count: number; required_subject_slug: string; minimum_study_days: number }
  current: CurrentProfile | null
}

const DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
]
const C = {
  bg: '#E8E8E5', surface: '#F7F7F3', white: '#FFFFFF', text: '#171A1C',
  muted: '#59636B', border: '#D4DAD9', blue: '#0876B8', paleBlue: '#E7F3FA',
  green: '#087A5D', red: '#B42318',
}

function safeDestination(value: string | null) {
  if (!value) return '/dashboard'
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin !== window.location.origin || url.pathname === '/auth' || url.pathname.startsWith('/auth/')) return '/dashboard'
    return url.pathname + url.search + url.hash
  } catch {
    return '/dashboard'
  }
}

export default function OnboardingPage() {
  const router = useRouter()
  const [data, setData] = useState<OnboardingResponse | null>(null)
  const [examDate, setExamDate] = useState('')
  const [studyDays, setStudyDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri'])
  const [dailyHours, setDailyHours] = useState('2')
  const [subjectIds, setSubjectIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch('/api/onboarding', { cache: 'no-store' })
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Could not load your setup options.')
        return body as OnboardingResponse
      })
      .then(body => {
        if (cancelled) return
        setData(body)
        const current = body.current
        if (current) {
          setExamDate(current.exam_date || '')
          setStudyDays(current.study_days?.length ? current.study_days : ['mon', 'tue', 'wed', 'thu', 'fri'])
          setDailyHours(String(current.daily_hours || 2))
          setSubjectIds(current.subject_ids || [])
          if (current.timetable_created && current.exam_date && (current.study_days?.length || 0) >= 5 && (current.subject_ids?.length || 0) === 4 && current.daily_hours) {
            router.replace(safeDestination(new URLSearchParams(window.location.search).get('redirect_url')))
          }
        } else {
          const english = body.subjects.find(subject => subject.slug === body.constraints.required_subject_slug)
          if (english) setSubjectIds([english.id])
        }
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load your setup options.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [router])

  const english = data?.subjects.find(subject => subject.slug === data.constraints.required_subject_slug)
  const selectedSubjects = useMemo(() => data?.subjects.filter(subject => subjectIds.includes(subject.id)) ?? [], [data, subjectIds])
  const canSubmit = Boolean(
    examDate &&
    studyDays.length >= (data?.constraints.minimum_study_days ?? 5) &&
    subjectIds.length === (data?.constraints.required_subject_count ?? 4) &&
    english && subjectIds.includes(english.id) &&
    Number(dailyHours) > 0
  )

  function toggleDay(day: string) {
    setStudyDays(previous => previous.includes(day) ? previous.filter(value => value !== day) : [...previous, day])
  }

  function toggleSubject(id: string) {
    setSubjectIds(previous => {
      if (previous.includes(id)) return previous.filter(value => value !== id)
      if (previous.length >= 4) return previous
      return [...previous, id]
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || saving) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/onboarding/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_date: examDate,
          study_days: studyDays,
          daily_hours: Number(dailyHours),
          subject_ids: subjectIds,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Your setup could not be saved.')
      router.replace(safeDestination(searchParams.get('redirect_url')))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your setup could not be saved. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: '28px 16px calc(32px + env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <header style={{ marginBottom: 22 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.blue, fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            <BookOpen size={15} /> Your study setup
          </div>
          <h1 style={{ margin: '10px 0 8px', fontSize: 30, lineHeight: 1.12, letterSpacing: '-.045em' }}>Let’s make your plan yours.</h1>
          <p style={{ margin: 0, color: C.muted, fontSize: 14, lineHeight: 1.65 }}>Set your exam date, subjects, and weekly rhythm. We’ll use these to prepare your timetable.</p>
        </header>

        {loading ? (
          <section style={{ padding: 24, borderRadius: 18, background: C.surface, border: '1px solid ' + C.border, textAlign: 'center', color: C.muted }}>
            <LoaderCircle size={22} style={{ margin: '0 auto 10px' }} /> Loading your setup…
          </section>
        ) : !data ? (
          <section style={{ padding: 20, borderRadius: 18, background: C.surface, border: '1px solid ' + C.border }}>
            <p role="alert" style={{ color: C.red, fontSize: 13 }}>{error || 'Setup options are unavailable right now.'}</p>
            <button onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 10, padding: '12px 16px', background: C.blue, color: '#fff', fontWeight: 750 }}>Try again</button>
          </section>
        ) : (
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <section style={{ padding: 18, borderRadius: 16, background: C.surface, border: '1px solid ' + C.border }}>
              <label htmlFor="exam-date" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, marginBottom: 10 }}><CalendarDays size={16} color={C.blue}/> When is your exam?</label>
              <input id="exam-date" type="date" min={new Date().toISOString().slice(0, 10)} value={examDate} onChange={e => setExamDate(e.target.value)} required style={{ width: '100%', boxSizing: 'border-box', padding: 13, borderRadius: 10, border: '1px solid ' + C.border, background: C.white, color: C.text, font: 'inherit' }} />
            </section>

            <section style={{ padding: 18, borderRadius: 16, background: C.surface, border: '1px solid ' + C.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <h2 style={{ margin: 0, fontSize: 15 }}>Your JAMB subjects</h2>
                <span style={{ color: subjectIds.length === 4 ? C.green : C.muted, fontSize: 12, fontWeight: 800 }}>{subjectIds.length}/4</span>
              </div>
              <p style={{ margin: '0 0 13px', color: C.muted, fontSize: 12, lineHeight: 1.5 }}>Choose exactly four. Use of English is compulsory.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
                {data.subjects.map(subject => {
                  const selected = subjectIds.includes(subject.id)
                  const required = subject.slug === data.constraints.required_subject_slug
                  const disabled = (!selected && subjectIds.length >= 4) || (required && selected)
                  return (
                    <button key={subject.id} type="button" aria-pressed={selected} disabled={disabled} onClick={() => toggleSubject(subject.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 46, padding: '10px 11px', textAlign: 'left', borderRadius: 10, border: '1px solid ' + (selected ? C.blue : C.border), background: selected ? C.paleBlue : C.white, color: C.text, opacity: disabled && !selected ? .55 : 1, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ width: 18, height: 18, flex: '0 0 18px', display: 'grid', placeItems: 'center', borderRadius: 5, border: '1px solid ' + (selected ? C.blue : C.border), background: selected ? C.blue : 'transparent', color: '#fff' }}>{selected && <Check size={13}/>}</span>
                      <span>{subject.name}{required ? ' *' : ''}</span>
                    </button>
                  )
                })}
              </div>
              {selectedSubjects.length > 0 && <p style={{ margin: '10px 0 0', color: C.muted, fontSize: 11 }}>Selected: {selectedSubjects.map(subject => subject.name).join(', ')}</p>}
            </section>

            <section style={{ padding: 18, borderRadius: 16, background: C.surface, border: '1px solid ' + C.border }}>
              <h2 style={{ margin: '0 0 5px', fontSize: 15 }}>Your weekly rhythm</h2>
              <p style={{ margin: '0 0 13px', color: C.muted, fontSize: 12, lineHeight: 1.5 }}>Choose at least five days you can usually study.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 5 }}>
                {DAYS.map(day => {
                  const selected = studyDays.includes(day.id)
                  return <button key={day.id} type="button" aria-pressed={selected} onClick={() => toggleDay(day.id)} style={{ padding: '10px 0', borderRadius: 9, border: '1px solid ' + (selected ? C.blue : C.border), background: selected ? C.paleBlue : C.white, color: selected ? C.blue : C.muted, fontSize: 11, fontWeight: 800 }}>{day.label}</button>
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16 }}>
                <Clock3 size={16} color={C.blue}/>
                <label htmlFor="daily-hours" style={{ flex: 1, fontSize: 13, fontWeight: 750 }}>Study time per day</label>
                <select id="daily-hours" value={dailyHours} onChange={e => setDailyHours(e.target.value)} style={{ padding: '10px 11px', borderRadius: 9, border: '1px solid ' + C.border, background: C.white, color: C.text, font: 'inherit' }}>
                  {['0.5', '1', '1.5', '2', '2.5', '3', '4', '5', '6', '8'].map(value => <option key={value} value={value}>{value} {Number(value) === 1 ? 'hour' : 'hours'}</option>)}
                </select>
              </div>
              <p style={{ margin: '8px 0 0', color: C.muted, fontSize: 11 }}>You can adjust your routine later as your schedule changes.</p>
            </section>

            {error && <p role="alert" style={{ margin: 0, padding: 12, borderRadius: 10, background: '#FCECEB', color: C.red, fontSize: 13 }}>{error}</p>}
            <button type="submit" disabled={!canSubmit || saving} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 9, width: '100%', padding: 15, border: 0, borderRadius: 12, background: C.blue, color: '#fff', fontSize: 14, fontWeight: 800, opacity: !canSubmit || saving ? .55 : 1 }}>
              {saving ? <><LoaderCircle size={17}/> Saving your plan…</> : <>Save setup and continue <ArrowRight size={16}/></>}
            </button>
            <p style={{ margin: 0, textAlign: 'center', color: C.muted, fontSize: 11 }}>Four subjects · Five or more study days · One plan built around you</p>
          </form>
        )}
      </div>
    </main>
  )
}
