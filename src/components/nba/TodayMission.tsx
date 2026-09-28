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
  const styles = "        .nba-prototype {\n          min-height:100vh;\n          margin:0;\n          padding:18px 14px 50px;\n          background:\n            radial-gradient(circle at 50% 0%, rgba(63,183,255,.12), transparent 34%),\n            #071426;\n          color:var(--color-text-primary);\n          font-family:Inter, system-ui, sans-serif;\n        }\n\n        .dashboard { width:min(100%, 620px); margin:0 auto; padding-top:8px; }\n\n        .topbar {\n          display:flex;\n          align-items:center;\n          justify-content:space-between;\n          margin-bottom:14px;\n          padding:0 2px;\n        }\n\n        .brand {\n          color:#E8F0F7;\n          font-family:Inter, system-ui, sans-serif;\n          font-size:16px;\n          font-weight:700;\n          letter-spacing:-.025em;\n        }\n\n        .context { color:var(--color-text-secondary); font-size:11px; }\n\n        .nba-card {\n          position:relative;\n          overflow:hidden;\n          padding:21px;\n          border:1px solid var(--color-border);\n          border-radius:14px;\n          background:var(--color-surface);\n          box-shadow:var(--shadow-card);\n        }\n\n        .nba-card::before {\n          content:\"\";\n          position:absolute;\n          top:0;\n          left:10%;\n          right:10%;\n          height:1px;\n          background:linear-gradient(90deg, transparent, rgba(63,183,255,.28), transparent);\n        }\n\n        .recommendation-row { position:relative; z-index:1; }\n        .recommendation-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid rgba(240,201,79,.18); border-radius:10px; background:rgba(127,92,21,.18); color:#F0C94F; font-size:11px; font-weight:750; }\n        .pulse-dot { width:6px; height:6px; border-radius:50%; background:#F0C94F; box-shadow:0 0 12px rgba(240,201,79,.6); }\n        .recommendation-body { position:relative; z-index:1; display:block; margin-top:20px; }\n        .eyebrow { display:block; margin-bottom:8px; color:rgba(232,240,247,.62); font-size:13px; }\n        .card-topline {\n          display:flex;\n          align-items:center;\n          justify-content:space-between;\n          gap:16px;\n          margin-bottom:24px;\n        }\n\n        .identity-tag {\n          display:inline-flex;\n          align-items:center;\n          min-height:28px;\n          padding:0 11px;\n          border:1px solid rgba(255,255,255,.16);\n          border-radius:8px;\n          background:rgba(255,255,255,.025);\n          color:var(--color-text-primary);\n          font-size:10px;\n          font-weight:800;\n          letter-spacing:.13em;\n          line-height:1;\n        }\n        .nba-tag {\n          border-color:rgba(63,183,255,.34);\n          background:rgba(63,183,255,.06);\n          color:var(--color-primary);\n        }\n        .subject-tag {\n          border-color:rgba(255,255,255,.13);\n        }\n\n        .subject { color:rgba(232,240,247,.55); font-size:11px; font-weight:700; }\n\n        .stage-label {\n          margin:0 0 8px;\n          color:rgba(232,240,247,.62);\n          font-size:13px;\n          line-height:1.4;\n        }\n\n        h1, h2 {\n          margin:0;\n          font-family:Inter, system-ui, sans-serif;\n          font-weight:700;\n          letter-spacing:-.045em;\n          line-height:1.04;\n        }\n\n        h1 { max-width:560px; font-size:clamp(31px, 8vw, 44px); }\n        h2 { font-size:26px; }\n\n        .detail, .support {\n          max-width:530px;\n          margin:13px 0 0;\n          color:rgba(232,240,247,.57);\n          font-size:13px;\n          line-height:1.6;\n        }\n\n        .meta {\n          display:flex;\n          flex-wrap:wrap;\n          gap:7px;\n          margin-top:18px;\n        }\n\n        .meta span {\n          display:inline-flex;\n          align-items:center;\n          gap:6px;\n          padding:7px 9px;\n          border:1px solid rgba(63,183,255,.20);\n          border-radius:8px;\n          background:rgba(7,20,38,.24);\n          color:rgba(232,240,247,.58);\n          font-size:11px;\n          line-height:1;\n        }\n\n        .primary {\n          width:100%;\n          min-height:50px;\n          margin-top:23px;\n          border:1px solid var(--color-primary);\n          border-radius:var(--radius);\n          background:linear-gradient(105deg,#2766F3 0%,#1E8CEB 52%,#1ED0A7 100%);\n          color:#06182A;\n          font:700 13px Inter, system-ui, sans-serif, system-ui, sans-serif;\n          cursor:pointer;\n        }\n\n        .primary span { margin-left:7px; }\n\n        .primary:hover { filter:brightness(1.06); }\n\n        .secondary {\n          width:100%;\n          min-height:50px;\n          margin-top:22px;\n          border:1px solid rgba(63,183,255,.60);\n          border-radius:12px;\n          background:transparent;\n          color:var(--color-primary);\n          font:800 13px Inter, \"Segoe UI\", system-ui, sans-serif;\n          cursor:pointer;\n        }\n\n        .secondary:hover { background:rgba(63,183,255,.09); }\n\n        button:focus-visible {\n          outline:2px solid #3FB7FF;\n          outline-offset:3px;\n        }\n\n        .timer {\n          margin-top:23px;\n          font-size:clamp(50px, 13vw, 76px);\n          font-weight:700;\n          letter-spacing:-.06em;\n          line-height:.95;\n          font-variant-numeric:tabular-nums;\n        }\n\n        .progress {\n          height:4px;\n          margin-top:19px;\n          overflow:hidden;\n          border-radius:999px;\n          background:rgba(232,240,247,.1);\n        }\n\n        .progress span {\n          display:block;\n          height:100%;\n          border-radius:inherit;\n          background:var(--color-primary);\n          transition:width 1s linear;\n        }\n\n        .reading-actions {\n          display:grid;\n          gap:8px;\n          margin-top:18px;\n        }\n\n        .reading-actions .secondary { margin-top:0; }\n\n        .text-button {\n          border:0;\n          background:transparent;\n          color:rgba(232,240,247,.48);\n          font:700 11px Inter, \"Segoe UI\", system-ui, sans-serif;\n          cursor:pointer;\n        }\n\n        .cta-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:18px; }

        .cta-row button { width:100%; }

        .boundary-end { color:#B9C8D3; border-color:rgba(185,200,211,.22); background:rgba(255,255,255,.025); }

        .boundary-message {
          display:flex;
          flex-direction:column;
          gap:7px;
          margin:16px 0 18px;
          padding:15px 16px;
          border:1px solid rgba(37,214,162,.28);
          border-radius:12px;
          background:rgba(37,214,162,.07);
        }

        .boundary-message strong {
          color:#F2F7FA;
          font-size:15px;
          line-height:1.45;
          font-weight:700;
        }

        .boundary-message span {
          color:#B9C8D3;
          font-size:13px;
          line-height:1.55;
        }

        .boundary-title {
          margin-bottom:0;
        }

        .boundary {\n          margin-top:18px;\n          padding:10px 11px;\n          border:1px solid rgba(232,240,247,.08);\n          border-radius:var(--radius-sm);\n          background:rgba(7,20,38,.24);\n          color:rgba(232,240,247,.5);\n          font-size:11px;\n          line-height:1.5;\n        }\n\n        .cta-row {\n          display:grid;\n          gap:8px;\n          margin-top:22px;\n        }\n\n        .cta-row .primary { margin-top:0; }\n\n        .reading-transition {\n          position:fixed;\n          z-index:50;\n          top:0;\n          left:0;\n          right:0;\n          display:flex;\n          justify-content:center;\n          pointer-events:none;\n          animation:dropFromTop 4s cubic-bezier(.22,.75,.2,1) forwards;\n        }\n\n        .transition-inner {\n          width:min(100% - 28px, 620px);\n          margin-top:14px;\n          padding:16px 17px;\n          border:1px solid var(--color-border);\n          border-radius:var(--radius-lg);\n          background:var(--color-surface);\n          box-shadow:0 18px 45px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.06);\n        }\n        .transition-kicker {\n          display:block;\n          margin-bottom:5px;\n          color:var(--color-primary);\n          font-size:9px;\n          font-weight:800;\n          letter-spacing:.14em;\n          text-transform:uppercase;\n        }\n        .reading-transition strong { display:block; font-size:15px; letter-spacing:-.02em; }\n        .reading-transition p { margin:6px 0 0; color:rgba(232,240,247,.55); font-size:11px; line-height:1.55; }\n\n        .disclaimer {\n          margin-top:17px;\n          border-top:1px solid rgba(232,240,247,.09);\n        }\n\n        .disclaimer-toggle {\n          display:flex;\n          width:100%;\n          align-items:center;\n          justify-content:space-between;\n          gap:12px;\n          padding:13px 0 4px;\n          border:0;\n          background:transparent;\n          color:rgba(232,240,247,.46);\n          font:600 11px Inter, \"Segoe UI\", system-ui, sans-serif;\n          text-align:left;\n          cursor:pointer;\n        }\n\n        .disclaimer-label { display:flex; align-items:center; gap:7px; }\n        .info-mark {\n          display:inline-flex; align-items:center; justify-content:center;\n          width:15px; height:15px; border:1px solid rgba(232,240,247,.25); border-radius:50%;\n          font-size:9px; font-weight:800;\n        }\n        .chevron {\n          display:inline-block;\n          font-size:15px;\n          line-height:1;\n          transition:transform .16s ease;\n        }\n\n        .chevron.open { transform:rotate(180deg); }\n\n        .disclaimer-body {\n          padding:8px 0 2px;\n          color:rgba(232,240,247,.5);\n          font-size:11px;\n          line-height:1.6;\n          animation:reveal .16s ease-out;\n        }\n\n        .disclaimer-body p { margin:0 0 8px; }\n        .disclaimer-body p:last-child { margin-bottom:0; }\n\n        .reading-info {\n          display:flex;\n          justify-content:space-between;\n          gap:12px;\n          margin-top:8px;\n          color:rgba(232,240,247,.46);\n          font-size:11px;\n        }\n\n        .dashboard-note {\n          margin:10px 3px 0;\n          color:rgba(232,240,247,.3);\n          font-size:10px;\n        }\n\n        .prototype-controls {\n          display:flex;\n          flex-wrap:wrap;\n          align-items:center;\n          gap:6px;\n          margin-top:28px;\n          padding:10px;\n          border:1px dashed rgba(232,240,247,.1);\n          border-radius:12px;\n          color:rgba(232,240,247,.35);\n          font-size:10px;\n        }\n\n        .prototype-controls button {\n          border:1px solid rgba(232,240,247,.12);\n          border-radius:var(--radius-sm);\n          padding:5px 8px;\n          background:rgba(255,255,255,.035);\n          color:rgba(232,240,247,.55);\n          font-size:10px;\n          cursor:pointer;\n        }\n\n        @keyframes dropFromTop {\n          0% { opacity:0; transform:translateY(-110%); }\n          12% { opacity:1; transform:translateY(0); }\n          86% { opacity:1; transform:translateY(0); }\n          100% { opacity:0; transform:translateY(-110%); }\n        }\n\n        @keyframes reveal {\n          from { opacity:0; transform:translateY(-4px); }\n          to { opacity:1; transform:translateY(0); }\n        }\n\n        @media (min-width:640px) {\n          .nba-prototype { padding:24px 18px 60px; }\n          .dashboard { padding-top:10px; }\n          .nba-card { padding:27px; }\n          .mission-card { margin-inline:0; }\n          .primary, .secondary { width:auto; min-width:210px; padding-inline:22px; }\n          .reading-actions { display:flex; align-items:center; }\n          .reading-actions .secondary { flex:0 0 auto; }\n        }\n      \n.nba-prototype{position:relative;z-index:1;min-height:auto;padding:0;background:transparent}.reading-transition{position:fixed!important;z-index:9999!important;inset:0!important;display:flex;align-items:flex-start;justify-content:center;pointer-events:none}.reading-transition .transition-inner{position:relative;z-index:10000!important;margin-top:72px}.loading-state{padding-top:22px}.skeleton{display:block;border-radius:7px;background:linear-gradient(90deg,rgba(255,255,255,.045) 25%,rgba(255,255,255,.09) 50%,rgba(255,255,255,.045) 75%);background-size:200% 100%;animation:nba-shimmer 1.5s ease-in-out infinite}.skeleton-topic{width:190px;height:24px;margin-bottom:22px}.skeleton-title{width:78%;height:30px;margin-bottom:10px}.skeleton-title.short{width:52%;margin-bottom:22px}.skeleton-row{display:flex;gap:18px;margin-bottom:24px}.skeleton-meta{width:74px;height:16px}.skeleton-meta.small{width:88px}.skeleton-button{width:100%;height:46px;border-radius:10px}.skeleton-subject{width:78px;height:28px;border-radius:999px}@keyframes nba-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.concept-title{font-size:22px!important;line-height:1.22!important;letter-spacing:-.02em!important;max-width:620px}.mission-card{position:relative;overflow:visible;margin-inline:8px;padding:21px;border:1px solid var(--color-border);border-radius:14px;background:var(--color-surface);box-shadow:var(--shadow-card)}\n.mission-card::before{content:\"\";position:absolute;top:0;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(63,183,255,.28),transparent)}\n.subject-picker{position:relative}.subject-trigger{gap:7px;cursor:pointer}.subject-menu{position:absolute;z-index:30;right:0;top:36px;min-width:170px;padding:6px;border:1px solid var(--color-border);border-radius:12px;background:var(--color-surface);box-shadow:0 18px 40px rgba(0,0,0,.3)}.subject-option{display:block;width:100%;padding:10px 11px;border:0;border-radius:8px;background:transparent;color:rgba(232,240,247,.62);text-align:left;font:600 11px Inter,system-ui,sans-serif;cursor:pointer}.subject-option:hover,.subject-option.active{background:rgba(63,183,255,.08);color:var(--color-text-primary)}.chevron-open{transform:rotate(180deg)}.meta-time svg{color:#25d6a2;flex:none}.mission-error{color:#ff8b8b}.primary:disabled,.secondary:disabled{opacity:.55;cursor:default}"
  return <section className='nba-prototype'><div className='dashboard'>{children}</div><style jsx global>{styles}</style></section>
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