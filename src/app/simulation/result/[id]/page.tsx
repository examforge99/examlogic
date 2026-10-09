'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Target } from 'lucide-react'

type Attempt = { question_id: string; subject_id: string; is_correct: boolean | null; time_taken_seconds: number | null }
type Session = { total_questions?: number; correct_count?: number; total_time_seconds?: number; overall_accuracy_percent?: number; started_at?: string; completed_at?: string }
type ResultPayload = { session: Session; attempts: Attempt[]; subjectMap: Record<string, { name: string; slug: string }> }

const C = { bg: '#F7F7F3', surface: '#FFFFFF', text: '#17232C', muted: '#687782', blue: '#0876B8', border: '#DCE4E8', green: '#087A5D' }

export default function SimulationResultPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<ResultPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadResult() {
      try {
        const response = await fetch(`/api/simulation/session/${params.id}/result`, { cache: 'no-store' })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Your result is not available yet.')
        if (!cancelled) setData(body as ResultPayload)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load your result.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadResult()
    return () => { cancelled = true }
  }, [params.id])

  const subjectStats = useMemo(() => {
    if (!data) return []
    const grouped = new Map<string, { total: number; correct: number }>()
    data.attempts.forEach(attempt => {
      const current = grouped.get(attempt.subject_id) ?? { total: 0, correct: 0 }
      current.total += 1
      if (attempt.is_correct) current.correct += 1
      grouped.set(attempt.subject_id, current)
    })
    return Array.from(grouped.entries()).map(([id, stats]) => ({
      id,
      name: data.subjectMap[id]?.name || 'Subject',
      ...stats,
      accuracy: stats.total ? Math.round(stats.correct / stats.total * 100) : 0,
    })).sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  if (loading) return <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: 20 }}><div role="status" style={{ maxWidth: 620, margin: '25px auto', height: 220, borderRadius: 18, background: C.surface, border: '1px solid ' + C.border, padding: 20 }}>Loading your simulation result…</div></main>
  if (error || !data) return <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: 24, display: 'grid', placeItems: 'center' }}><section style={{ maxWidth: 420, textAlign: 'center' }}><h1 style={{ fontSize: 23 }}>Result unavailable</h1><p style={{ color: C.muted, lineHeight: 1.6 }}>{error || 'Your result could not be found.'}</p><button onClick={() => router.push('/simulation')} style={{ padding: 12, border: 0, borderRadius: 10, background: C.blue, color: '#fff', fontWeight: 700 }}>Back to simulation</button></section></main>

  const session = data.session
  const accuracy = Number(session.overall_accuracy_percent ?? 0)
  const minutes = Math.floor(Number(session.total_time_seconds ?? 0) / 60)
  const seconds = Math.round(Number(session.total_time_seconds ?? 0) % 60)

  return <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: '26px 16px calc(30px + env(safe-area-inset-bottom))' }}>
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <button onClick={() => router.push('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, border: '1px solid ' + C.border, background: C.surface, color: C.text }}><ArrowLeft size={15}/> Dashboard</button>
      <section style={{ marginTop: 22, padding: 22, borderRadius: 18, border: '1px solid ' + C.border, background: C.surface }}>
        <p style={{ margin: 0, color: C.blue, fontSize: 10, fontWeight: 800, letterSpacing: '.13em' }}>JAMB SIMULATION</p>
        <h1 style={{ margin: '8px 0 4px', fontSize: 28, letterSpacing: '-.04em' }}>Exam complete</h1>
        <p style={{ margin: 0, color: C.muted, fontSize: 13 }}>A clear breakdown of this attempt, without the noise.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10, marginTop: 20 }}>
          {[
            { label: 'Accuracy', value: `${Math.round(accuracy)}%`, icon: Target },
            { label: 'Correct answers', value: String(session.correct_count ?? data.attempts.filter(a => a.is_correct).length), icon: CheckCircle2 },
            { label: 'Questions answered', value: String(data.attempts.length), icon: BookOpen },
            { label: 'Time used', value: `${minutes}m ${seconds}s`, icon: Clock3 },
          ].map(({ label, value, icon: Icon }) => <div key={label} style={{ padding: 15, borderRadius: 13, border: '1px solid ' + C.border, background: C.bg }}>
            <Icon size={17} color={C.blue}/>
            <p style={{ margin: '11px 0 4px', fontSize: 22, fontWeight: 800, letterSpacing: '-.03em' }}>{value}</p>
            <p style={{ margin: 0, color: C.muted, fontSize: 11 }}>{label}</p>
          </div>)}
        </div>
      </section>
      <section style={{ marginTop: 14, padding: 18, borderRadius: 16, border: '1px solid ' + C.border, background: C.surface }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Subject breakdown</h2>
        <div style={{ display: 'grid', gap: 14, marginTop: 16 }}>
          {subjectStats.length ? subjectStats.map(subject => <div key={subject.id}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
              <strong>{subject.name}</strong><span style={{ color: C.muted }}>{subject.correct}/{subject.total} · {subject.accuracy}%</span>
            </div>
            <div style={{ height: 6, marginTop: 7, borderRadius: 20, background: '#E4EAED', overflow: 'hidden' }}><div style={{ width: subject.accuracy + '%', height: '100%', background: subject.accuracy >= 70 ? C.green : C.blue, borderRadius: 20 }}/></div>
          </div>) : <p style={{ color: C.muted, fontSize: 13 }}>Subject breakdown will appear when answer records are available.</p>}
        </div>
      </section>
      <button onClick={() => router.push('/simulation')} style={{ width: '100%', marginTop: 16, padding: 14, border: 0, borderRadius: 12, background: C.blue, color: '#fff', fontWeight: 750 }}>Start another simulation</button>
    </div>
  </main>
}
