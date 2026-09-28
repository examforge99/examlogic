'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, Clock3 } from 'lucide-react'
import MissionLoading from './MissionLoading'
import MissionEmpty from './MissionEmpty'
import MissionError from './MissionError'
import MissionDisclaimer from './MissionDisclaimer'
import MissionReading from './MissionReading'

type Action = 'READ' | 'RECALL' | 'PRACTICE' | 'REVIEW' | 'DRILL' | 'RELEARN'

type Mission = {
  subject_id: string
  subject_name?: string
  topic_id: string
  topic_name?: string
  concept_window_id: string
  concept_name: string
  concept_progression_order: number
  concept_description: string | null
  estimated_minutes: number
  action_type: Action
  phase: string
  message: string
  time_boundary_reached: boolean
  topic_concept_boundary_reached: boolean
  continuation_available: boolean
  subject_exhausted: boolean
  next_transition: null
}

type Stage = 'loading' | 'ready' | 'reading' | 'recommended' | 'next-action' | 'boundary' | 'complete' | 'error'
type CompletionResult = { completed: boolean; batch_completed: boolean }

const actionCopy: Record<Action, { lead: string; detail: string; secondaryMetric: string; cta: string }> = {
  READ: { lead: 'Start with the concept', detail: 'Key ideas, definitions, and relationships', secondaryMetric: 'Guided reading', cta: 'Start Reading' },
  RECALL: { lead: 'Test what stuck', detail: 'Show-answer recall on the key ideas', secondaryMetric: 'Recall', cta: 'Start Recall' },
  PRACTICE: { lead: 'Time to test yourself', detail: 'JAMB-style questions focused on this concept', secondaryMetric: 'Practice', cta: 'Start Practice' },
  REVIEW: { lead: 'Refresh the concept', detail: 'Focused review of the key ideas', secondaryMetric: 'Review', cta: 'Start Review' },
  DRILL: { lead: 'Exam is getting close', detail: 'JAMB-style questions focused on this concept', secondaryMetric: 'Drill', cta: 'Start Drill' },
  RELEARN: { lead: 'Take another look', detail: 'Rebuild the concept from the foundations', secondaryMetric: 'Relearn', cta: 'Start Relearning' },
}

export default function TodayMission() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [stage, setStage] = useState<Stage>('loading')
  const [seconds, setSeconds] = useState(0)
  const [notice, setNotice] = useState(false)
  const [boundaryResult, setBoundaryResult] = useState<CompletionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)
  const readingStartedAt = useRef<number | null>(null)

  const subjects = useMemo(() => {
    const seen = new Set<string>()
    return missions.filter((mission) => {
      if (seen.has(mission.subject_id)) return false
      seen.add(mission.subject_id)
      return true
    })
  }, [missions])

  const currentMission = useMemo(() => {
    const pool = selectedSubjectId ? missions.filter((mission) => mission.subject_id === selectedSubjectId) : missions
    return pool.find((mission) => !completedIds.has(mission.concept_window_id)) ?? null
  }, [missions, completedIds, selectedSubjectId])

  const selectedSubject = subjects.find((subject) => subject.subject_id === selectedSubjectId)
  const copy = currentMission ? actionCopy[currentMission.action_type] : actionCopy.READ

  useEffect(() => { void loadBatch() }, [])

  useEffect(() => {
    if (stage !== 'reading' || !currentMission) return
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [stage, currentMission])

  useEffect(() => {
    if (stage === 'reading' && seconds === 0) setStage('recommended')
  }, [seconds, stage])

  const cacheKey = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return `examlogic:nba:${today}`
  }, [])

  function readCachedBatch(): Mission[] | null {
    try {
      const raw = window.localStorage.getItem(cacheKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed as Mission[] : null
    } catch {
      return null
    }
  }

  function writeCachedBatch(batch: Mission[]) {
    try {
      window.localStorage.setItem(cacheKey, JSON.stringify(batch))
    } catch {
      // Cache is an optimization. API remains authoritative.
    }
  }

  function showBatch(next: Mission[]) {
    setMissions(next)
    setCompletedIds(new Set())
    setBoundaryResult(null)
    if (!next.length) {
      setStage('complete')
      return
    }
    setSelectedSubjectId((current) => next.some((mission) => mission.subject_id === current) ? current : next[0].subject_id)
    setStage('ready')
  }

  async function loadBatch() {
    setError(null)
    const cached = readCachedBatch()
    if (cached?.length) {
      showBatch(cached)
    } else {
      setStage('loading')
    }

    setApiLoading(true)
    try {
      const response = await fetch('/api/nba/fire', {
        method: 'POST',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      const contentType = response.headers.get('content-type') ?? ''
      const raw = await response.text()
      let data: unknown = null

      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(raw)
        } catch {
          throw new Error('The NBA service returned invalid JSON.')
        }
      } else {
        throw new Error(
          response.status === 404
            ? 'The NBA endpoint is not available on this deployment.'
            : `The NBA service returned an unexpected response (HTTP ${response.status}).`,
        )
      }

      if (!response.ok) {
        const message =
          typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Failed to load today’s mission.'
        throw new Error(message)
      }

      const next = (Array.isArray(data) ? data : []) as Mission[]
      writeCachedBatch(next)
      showBatch(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load today’s mission.')
      setStage('error')
    } finally {
      setApiLoading(false)
    }
  }
  function startReading() {
    if (!currentMission) return
    setNotice(true); readingStartedAt.current = Date.now(); setStage('reading'); setSeconds(Math.max(1, currentMission.estimated_minutes) * 60)
    window.setTimeout(() => setNotice(false), 4000)
  }

  function finishReading() { setStage('next-action') }

  async function completeMission() {
    if (!currentMission || busy) return
    setBusy(true); setError(null)
    try {
      const response = await fetch('/api/nba/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept_window_id: currentMission.concept_window_id, action_type: currentMission.action_type, time_spent_seconds: readingStartedAt.current ? Math.max(0, Math.floor((Date.now() - readingStartedAt.current) / 1000)) : 0 }),
      })
      const result = await response.json() as CompletionResult & { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Failed to complete this mission.')
      const done = new Set(completedIds); done.add(currentMission.concept_window_id); setCompletedIds(done); setBoundaryResult(result)
      readingStartedAt.current = null
      if (result.batch_completed) setStage('boundary')
      else advanceWithinBatch(done)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete this mission.')
      setStage('error')
    } finally { setBusy(false) }
  }

  function advanceWithinBatch(done: Set<string>) {
    const sameSubject = selectedSubjectId ? missions.filter((mission) => mission.subject_id === selectedSubjectId) : missions
    if (sameSubject.some((mission) => !done.has(mission.concept_window_id))) { setStage('ready'); return }
    const fallback = missions.find((mission) => !done.has(mission.concept_window_id))
    if (!fallback) { setStage('complete'); return }
    setSelectedSubjectId(fallback.subject_id); setStage('ready')
  }

  async function continueFromBoundary() {
    if (busy) return
    if (boundaryResult?.batch_completed) {
      setBusy(true); setError(null)
      try {
        const response = await fetch('/api/nba/fire', { method: 'POST', cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(data?.error ?? 'Failed to generate the next NBA batch.')
        const next = (data ?? []) as Mission[]
        writeCachedBatch(next)
        showBatch(next)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate the next NBA batch.')
        setStage('error')
      } finally { setBusy(false) }
      return
    }
    const done = new Set(completedIds); setBoundaryResult(null); advanceWithinBatch(done)
  }

  function selectSubject(subjectId: string) {
    setSelectedSubjectId(subjectId); setSubjectOpen(false); setStage('ready')
  }

  if (stage === 'loading') return <MissionShell><MissionLoading /></MissionShell>
  if (stage === 'error') return <MissionShell><MissionError error={error} onRetry={() => void loadBatch()} /></MissionShell>
  if (stage === 'complete') return <MissionShell><MissionEmpty onContinue={() => { setBoundaryResult({ completed: true, batch_completed: true }); setStage('boundary') }} /></MissionShell>

  const subjectLabel = selectedSubject?.subject_name ?? selectedSubject?.subject_id ?? 'Subject'

  return (
    <MissionShell>
      <MissionDisclaimer open={notice} />
      <MissionCard>
        <div className='card-topline'>
          <span className='identity-tag nba-tag'>Today’s Mission</span>
          <div className='subject-picker'>
            <button className='identity-tag subject-tag subject-trigger' disabled={stage !== 'ready'} onClick={() => setSubjectOpen((value) => !value)} aria-expanded={subjectOpen}>{subjectLabel}<ChevronDown size={14} className={subjectOpen ? 'chevron-open' : ''} /></button>
            {subjectOpen && <div className='subject-menu'>{subjects.map((subject) => <button key={subject.subject_id} className={subject.subject_id === selectedSubjectId ? 'subject-option active' : 'subject-option'} onClick={() => selectSubject(subject.subject_id)}>{subject.subject_name ?? subject.subject_id}</button>)}</div>}
          </div>
        </div>
        {stage === 'reading' && currentMission ? <MissionReading seconds={seconds} estimatedMinutes={currentMission.estimated_minutes} onDone={finishReading} />
          : stage === 'recommended' ? <RecommendedState onContinue={startReading} onReady={finishReading} />
          : stage === 'next-action' && currentMission ? <NextActionState conceptName={currentMission.concept_name} onAction={() => void completeMission()} busy={busy} />
          : stage === 'boundary' ? <BoundaryStateView timeBoundary={currentMission?.time_boundary_reached ?? false} topicBoundary={currentMission?.topic_concept_boundary_reached ?? false} batchCompleted={boundaryResult?.batch_completed ?? false} onContinue={() => void continueFromBoundary()} onEnd={() => setStage('complete')} busy={busy} />
          : currentMission ? <>
              <div className='recommendation-row'><span className='recommendation-badge'><span className='pulse-dot' />{currentMission.topic_name ?? currentMission.concept_name}</span></div>
              <div className='recommendation-body'><div><span className='eyebrow'>{copy.lead}</span><h1 className='concept-title'>{currentMission.action_type === 'READ' ? 'Read ' : ''}{currentMission.concept_name}</h1><p className='detail'>{currentMission.concept_description ?? copy.detail}</p><div className='meta'><span className='meta-time'><Clock3 size={13} strokeWidth={2} />{currentMission.estimated_minutes} min</span><span>{copy.secondaryMetric}</span></div></div></div>
              <button className='primary' onClick={startReading}>{copy.cta} <span>→</span></button>
            </> : null}
      </MissionCard>
      
    </MissionShell>
  )
}

function MissionShell({ children }: { children: ReactNode }) {
  return (
    <>
      <style jsx>{`
        .nba-prototype {
          min-height:100vh;
          margin:0;
          padding:18px 14px 50px;
          background: radial-gradient(circle at 50% 0%, rgba(63,183,255,.12), transparent 34%), #071426;
          color:var(--color-text-primary);
          font-family:Inter, system-ui, sans-serif;
        }
        .dashboard { width:min(100%, 620px); margin:0 auto; padding-top:8px; }
        .mission-card { position:relative; overflow:visible; margin-inline:8px; padding:21px; }
        .cta-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:18px; }
        .cta-row button { width:100%; }
        .boundary-end { color:#B9C8D3; border-color:rgba(185,200,211,.22); background:rgba(255,255,255,.025); }
        .boundary-message { display:flex; flex-direction:column; gap:7px; margin:16px 0 18px; padding:15px 16px; border:1px solid rgba(37,214,162,.28); border-radius:12px; background:rgba(37,214,162,.07); }
        .boundary-message strong { color:#F2F7FA; font-size:15px; line-height:1.45; font-weight:700; }
        .boundary-message span { color:#B9C8D3; font-size:13px; line-height:1.55; }
        .boundary-title { margin-bottom:0; }
        @media (min-width:640px) {
          .dashboard { padding-top:10px; }
          .mission-card { margin-inline:0; padding:27px; }
        }
      `}</style>
      <div className='nba-prototype'><div className='dashboard'>{children}</div></div>
    </>
  )
}

function MissionCard({ children }: { children: React.ReactNode }) { return <article className='mission-card' aria-label='Today’s Mission'>{children}</article> }

function RecommendedState({ onContinue, onReady }: { onContinue: () => void; onReady: () => void }) {
  return <><p className='stage-label'>Recommended time reached</p><h2>You can keep reading.</h2><p className='support'>You’ve reached the recommended reading window. Continue if you need more time, or move on when you’re ready.</p><div className='boundary'>Recommended window reached • Extra reading continues without changing the recommendation.</div><div className='cta-row'><button className='primary' onClick={onContinue}>Continue Reading <span>→</span></button><button className='text-button' onClick={onReady}>I’m Ready →</button></div></>
}

function NextActionState({ conceptName, onAction, busy }: { conceptName: string; onAction: () => void; busy: boolean }) {
  return <><p className='stage-label'>Test what stuck</p><h2>Quick recall on {conceptName}</h2><p className='support'>Check what you can retrieve before moving on.</p><div className='meta'><span>Recall</span><span>Next in progression</span></div><button className='primary' onClick={onAction} disabled={busy}>{busy ? 'Saving…' : 'Complete Concept'} <span>→</span></button></>
}

function BoundaryStateView({ timeBoundary, topicBoundary, batchCompleted, onContinue, onEnd, busy }: { timeBoundary: boolean; topicBoundary: boolean; batchCompleted: boolean; onContinue: () => void; onEnd: () => void; busy: boolean }) {
  const reasons = [timeBoundary ? 'You’ve reached today’s study goal.' : null, topicBoundary ? 'You’ve reached the end of this topic.' : null].filter(Boolean)
  const reason = reasons.length ? reasons.join(' ') : batchCompleted ? 'This NBA batch is complete.' : 'More eligible work is available in today’s scheduled scope.'
  const nextStep = batchCompleted ? 'You’ve completed everything in this batch. Continue to load the next available mission.' : 'There’s still eligible work in today’s schedule. Continue to move to the next concept.'
  return <><p className='stage-label boundary-label'>Session boundary</p><h2 className='boundary-title'>You’ve reached a stopping point.</h2><div className='boundary-message'><strong>{reason}</strong><span>{nextStep}</span></div><div className='cta-row'><button className='primary' onClick={onContinue} disabled={busy}>{busy ? 'Loading…' : 'Continue'} <span>→</span></button><button className='secondary boundary-end' onClick={onEnd} disabled={busy}>End session</button></div></>
}

function formatTime(seconds: number) { const minutes = Math.floor(seconds / 60); const secs = seconds % 60; return String(minutes).padStart(2,'0') + ':' + String(secs).padStart(2,'0') }