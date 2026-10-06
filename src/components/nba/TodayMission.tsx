'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ChevronDown, Clock3 } from 'lucide-react'
import MissionLoading from './MissionLoading'
import MissionEmpty, { type MissionReason } from './MissionEmpty'
import MissionError from './MissionError'
import MissionReading from './MissionReading'

type Action = 'READ' | 'RECALL' | 'PRACTICE' | 'REVIEW' | 'DRILL' | 'RELEARN'
export type Mission = {
  batch_id: string
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
type FireResponse = { reason: MissionReason | 'ok'; missions: Mission[] }
type Stage = 'loading' | 'ready' | 'reading' | 'recommended' | 'next-action' | 'boundary' | 'empty' | 'error'
type CompletionResult = { completed: boolean; batch_completed: boolean; subject_completed?: boolean }

const BLUE = '#3FB7FF'
const TEXT = '#E8F0F7'
const MUTED = 'rgba(232,240,247,.68)'

const styles = {
  shell: { width: '100%', minWidth: 0, color: TEXT } as const,
  card: {
    position: 'relative',
    width: '100%',
    minHeight: 260,
    maxHeight: 420,
    minWidth: 0,
    boxSizing: 'border-box',
    padding: 18,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 14,
    background: '#0A0F14',
    boxShadow: '0 20px 40px rgba(0,0,0,.22)',
  } as const,
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 24, minWidth: 0, flexShrink: 0 } as const,
  tag: { display: 'inline-flex', alignItems: 'center', minWidth: 0, color: TEXT, fontSize: 14, lineHeight: 1.25, fontWeight: 800, letterSpacing: '-.01em' } as const,
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
    maxWidth: '72%',
    minWidth: 0,
    minHeight: 32,
    padding: 0,
    border: 0,
    background: 'transparent',
    color: MUTED,
    fontSize: 11,
    fontWeight: 650,
    cursor: 'pointer',
  } as const,
  text: { minWidth: 0, overflow: 'hidden', textOverflow: 'clip', whiteSpace: 'nowrap' } as const,
  stage: { margin: 0, color: MUTED, fontSize: 'clamp(11px, 1.9vw, 13px)', lineHeight: 1.45 } as const,
  title: {
    margin: 0,
    color: BLUE,
    fontSize: 'clamp(20px, 4.2vw, 27px)',
    lineHeight: 1.18,
    letterSpacing: '-.025em',
    fontWeight: 800,
    overflowWrap: 'anywhere',
  } as const,
  support: { margin: '12px 0 0', color: MUTED, fontSize: 'clamp(12px, 2vw, 14px)', lineHeight: 1.55 } as const,
  meta: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 18, color: MUTED, fontSize: 'clamp(11px, 1.8vw, 12px)', lineHeight: 1.4 } as const,
  primary: {
    width: '100%',
    minHeight: 42,
    marginTop: 'auto',
    padding: '0 14px',
    border: 0,
    borderRadius: 10,
    background: BLUE,
    color: '#06182A',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  } as const,
  secondary: {
    width: '100%',
    minHeight: 42,
    marginTop: 'auto',
    border: '1px solid rgba(63,183,255,.48)',
    borderRadius: 10,
    background: 'transparent',
    color: BLUE,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  } as const,
  textButton: { minHeight: 44, border: 0, background: 'transparent', color: MUTED, fontSize: 12, fontWeight: 750, cursor: 'pointer' } as const,
  detail: { margin: '12px 0 0', color: MUTED, fontSize: 'clamp(12px, 2vw, 14px)', lineHeight: 1.55, overflow: 'visible' } as const,
  boundary: { marginTop: 9, padding: 8, border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, background: 'rgba(255,255,255,.025)', color: MUTED, fontSize: 11, lineHeight: 1.45 } as const,
}

const actionCopy: Record<Action, { lead: string; detail: string; cta: string }> = {
  READ: { lead: 'Start with the concept', detail: 'Key ideas, definitions, and relationships', cta: 'Start Reading' },
  RECALL: { lead: 'Test what stuck', detail: 'Show-answer recall on the key ideas', cta: 'Start Recall' },
  PRACTICE: { lead: 'Time to test yourself', detail: 'JAMB-style questions focused on this concept', cta: 'Start Practice' },
  REVIEW: { lead: 'Refresh the concept', detail: 'Focused review of the key ideas', cta: 'Start Review' },
  DRILL: { lead: 'Exam is getting close', detail: 'JAMB-style questions focused on this concept', cta: 'Start Drill' },
  RELEARN: { lead: 'Take another look', detail: 'Rebuild the concept from the foundations', cta: 'Start Relearning' },
}
const ERROR_COPY: Record<string, string> = {
  UNAUTHORIZED: 'Please sign in again to load your mission.',
  INVALID_RESPONSE: 'The mission service returned an invalid response.',
  SERVICE_UNAVAILABLE: 'Today’s mission is temporarily unavailable. Please try again.',
  UNKNOWN: 'We couldn’t load today’s mission. Please try again.',
}

export default function TodayMission({ initialMissions, deferFetch = false, initialError, onDashboardRefresh }: { initialMissions?: Mission[]; deferFetch?: boolean; initialError?: string | null; onDashboardRefresh?: () => void | Promise<void> }) {
  const [missions, setMissions] = useState<Mission[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [highlightedSubject, setHighlightedSubject] = useState(0)
  const [stage, setStage] = useState<Stage>('loading')
  const [reason, setReason] = useState<MissionReason>('all_done')
  const [seconds, setSeconds] = useState(0)
  const [boundaryResult, setBoundaryResult] = useState<CompletionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [apiLoading, setApiLoading] = useState(false)
  const [startBusy, setStartBusy] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const readingStartedAt = useRef<number | null>(null)
  const subjects = useMemo(() => {
    const seen = new Set<string>()
    return missions.filter(m => !seen.has(m.subject_id) && (seen.add(m.subject_id), true))
  }, [missions])
  const currentMission = useMemo(() => {
    const pool = selectedSubjectId ? missions.filter(m => m.subject_id === selectedSubjectId) : missions
    return pool.find(m => !completedIds.has(m.concept_window_id)) ?? null
  }, [missions, completedIds, selectedSubjectId])
  const selectedSubject = subjects.find(s => s.subject_id === selectedSubjectId)
  const selectedSubjectComplete = stage === 'ready' && Boolean(selectedSubjectId) && !currentMission
  const copy = currentMission ? actionCopy[currentMission.action_type] : actionCopy.READ

  useEffect(() => {
    if (initialError) { setError(initialError); setStage('error'); return }
    if (initialMissions?.length) {
      setMissions(initialMissions)
      setSelectedSubjectId(current => initialMissions.some(m => m.subject_id === current) ? current : initialMissions[0].subject_id)
      setStage('ready')
      return
    }
    if (!deferFetch) void loadMissions()
  }, [initialMissions, deferFetch])

  useEffect(() => {
    if (stage !== 'reading' || !currentMission) return
    const timer = window.setInterval(() => setSeconds(v => Math.max(0, v - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [stage, currentMission])

  useEffect(() => { if (stage === 'reading' && seconds === 0) setStage('recommended') }, [seconds, stage])

  useEffect(() => {
    if (!subjectOpen) return
    const outside = (event: globalThis.PointerEvent) => { if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) closeSubjectMenu() }
    const escape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); closeSubjectMenu() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [subjectOpen])

  function closeSubjectMenu() {
    setSubjectOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }
  function openSubjectMenu() {
    if (stage !== 'ready' || !subjects.length || busy || startBusy) return
    const index = Math.max(0, subjects.findIndex(s => s.subject_id === selectedSubjectId))
    setHighlightedSubject(index)
    setSubjectOpen(true)
    window.setTimeout(() => optionRefs.current[index]?.focus(), 0)
  }
  function triggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!subjectOpen) openSubjectMenu() }
    if (event.key === 'Escape' && subjectOpen) { event.preventDefault(); closeSubjectMenu() }
  }
  function optionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null
    if (event.key === 'ArrowDown') next = (index + 1) % subjects.length
    if (event.key === 'ArrowUp') next = (index - 1 + subjects.length) % subjects.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = subjects.length - 1
    if (next !== null) { event.preventDefault(); setHighlightedSubject(next); optionRefs.current[next]?.focus(); return }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectSubject(subjects[index].subject_id) }
    if (event.key === 'Escape') { event.preventDefault(); closeSubjectMenu() }
  }
  function applyResponse(data: FireResponse) {
    setMissions(data.missions); setCompletedIds(new Set()); setBoundaryResult(null)
    if (data.reason === 'ok' && data.missions.length) {
      setSelectedSubjectId(current => data.missions.some(m => m.subject_id === current) ? current : data.missions[0].subject_id)
      setStage('ready'); return
    }
    setReason(data.reason === 'ok' ? 'all_done' : data.reason); setSelectedSubjectId(''); setStage('empty')
  }

  async function loadMissions() {
    if (apiLoading) return
    setError(null)
    setStage('loading')
    setApiLoading(true)
    try {
      const response = await fetch('/api/nba/fire', { method: 'POST', cache: 'no-store', headers: { Accept: 'application/json' } })
      const type = response.headers.get('content-type') ?? ''
      const raw = await response.text()
      if (!type.includes('application/json')) { console.error('[TodayMission] Non-JSON response', response.status); throw new Error('INVALID_RESPONSE') }
      let data: unknown
      try { data = JSON.parse(raw) } catch (e) { console.error('[TodayMission] Invalid JSON', e); throw new Error('INVALID_RESPONSE') }
      if (!response.ok) {
        const code = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string' ? data.error : 'UNKNOWN'
        console.error('[TodayMission] Fire failed', { status: response.status, code }); throw new Error(code)
      }
      if (typeof data !== 'object' || data === null || !('reason' in data) || !('missions' in data) || !Array.isArray(data.missions)) {
        console.error('[TodayMission] Invalid response shape'); throw new Error('INVALID_RESPONSE')
      }
      applyResponse(data as FireResponse)
    } catch (e) {
      const code = e instanceof Error ? e.message : 'UNKNOWN'
      console.error('[TodayMission] Load error', e)
      setError(ERROR_COPY[code] ?? ERROR_COPY.UNKNOWN); setStage('error')
    } finally { setApiLoading(false) }
  }

  function startReading() {
    if (!currentMission || startBusy || busy) return
    setStartBusy(true); readingStartedAt.current = Date.now(); setSeconds(Math.max(1, currentMission.estimated_minutes) * 60); setStage('reading')
    window.setTimeout(() => setStartBusy(false), 0)
  }
  function finishReading() { if (!busy) setStage('next-action') }

  async function completeMission() {
    if (!currentMission || busy) return
    setBusy(true); setError(null)
    try {
      const response = await fetch('/api/nba/complete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: currentMission.batch_id, concept_window_id: currentMission.concept_window_id, action_type: currentMission.action_type, time_spent_seconds: readingStartedAt.current ? Math.max(0, Math.floor((Date.now() - readingStartedAt.current) / 1000)) : 0 }),
      })
      const type = response.headers.get('content-type') ?? ''
      const raw = await response.text()
      if (!type.includes('application/json')) throw new Error('INVALID_RESPONSE')
      let result: CompletionResult & { error?: string }
      try { result = JSON.parse(raw) as CompletionResult & { error?: string } } catch { throw new Error('INVALID_RESPONSE') }
      if (!response.ok) { const code = result.error ?? 'UNKNOWN'; console.error('[TodayMission] Completion failed', { status: response.status, code }); throw new Error(code) }
      const done = new Set(completedIds); done.add(currentMission.concept_window_id); setCompletedIds(done); readingStartedAt.current = null
      void onDashboardRefresh?.()
      const remainingMissionCount = missions.filter(m => !done.has(m.concept_window_id)).length
      const sameSubjectRemaining = missions.some(m => m.subject_id === currentMission.subject_id && !done.has(m.concept_window_id))
      if (result.batch_completed || remainingMissionCount === 0) { setReason('all_done'); setStage('empty') }
      else if (sameSubjectRemaining) setStage('ready')
      else { setBoundaryResult({ ...result, subject_completed: true }); setStage('boundary') }
    } catch (e) {
      const code = e instanceof Error ? e.message : 'UNKNOWN'
      console.error('[TodayMission] Completion error', e); setError(ERROR_COPY[code] ?? ERROR_COPY.UNKNOWN); setStage('error')
    } finally { setBusy(false) }
  }
  function continueFromBoundary() {
    if (busy) return
    const remaining = missions.find(m => !completedIds.has(m.concept_window_id))
    if (!remaining) { setReason('all_done'); setStage('empty'); return }
    setSelectedSubjectId(remaining.subject_id); setBoundaryResult(null); setStage('ready')
  }
  function selectSubject(subjectId: string) {
    if (busy || startBusy) return
    setSelectedSubjectId(subjectId); setSubjectOpen(false); setStage('ready')
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }

  if (stage === 'loading') return <MissionShell><MissionLoading /></MissionShell>
  if (stage === 'error') return <MissionShell><MissionError error={error} onRetry={() => void loadMissions()} busy={apiLoading} /></MissionShell>
  if (stage === 'empty') return <MissionShell><MissionEmpty reason={reason} onAction={() => void loadMissions()} busy={apiLoading} /></MissionShell>

  const subjectLabel = selectedSubject?.subject_name ?? selectedSubject?.subject_id ?? 'Subject'

  return (
    <MissionShell>
      <article style={styles.card} aria-label='Today’s Mission'>
        <div style={styles.top}>
          <span style={styles.tag}>Today’s Mission</span>
          <div ref={pickerRef} style={{ position: 'relative', minWidth: 0, maxWidth: '72%' }}>
            <button
              ref={triggerRef}
              type='button'
              style={styles.trigger}
              disabled={stage !== 'ready' || busy || startBusy}
              aria-expanded={subjectOpen}
              aria-haspopup='listbox'
              aria-controls='today-mission-subject-list'
              onClick={() => subjectOpen ? closeSubjectMenu() : openSubjectMenu()}
              onKeyDown={triggerKeyDown}
              title={subjectLabel}
            >
              <span style={styles.text}>{subjectLabel}</span><ChevronDown size={15} aria-hidden='true' />
            </button>
            {subjectOpen && (
              <div id='today-mission-subject-list' role='listbox' aria-label='Scheduled subjects' style={{ position: 'absolute', zIndex: 30, right: 0, top: 'calc(100% + 6px)', minWidth: 190, maxWidth: 'calc(100vw - 32px)', padding: 6, border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, background: '#0D1B2E', boxShadow: '0 18px 40px rgba(0,0,0,.35)' }}>
                {subjects.map((subject, index) => {
                  const selected = subject.subject_id === selectedSubjectId
                  return <button key={subject.subject_id} ref={node => { optionRefs.current[index] = node }} type='button' role='option' aria-selected={selected} tabIndex={index === highlightedSubject ? 0 : -1} style={{ display: 'block', width: '100%', minHeight: 44, padding: '8px 11px', border: 0, borderRadius: 8, background: selected ? 'rgba(63,183,255,.10)' : 'transparent', color: selected ? TEXT : MUTED, fontSize: 12, fontWeight: selected ? 750 : 600, textAlign: 'left', cursor: 'pointer' }} onClick={() => selectSubject(subject.subject_id)} onKeyDown={e => optionKeyDown(e, index)}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subject.subject_name ?? subject.subject_id}</span>
                  </button>
                })}
              </div>
            )}
          </div>
        </div>

        {stage === 'reading' && currentMission ? (
          <MissionReading seconds={seconds} estimatedMinutes={currentMission.estimated_minutes} conceptName={currentMission.concept_name} action={currentMission.action_type} onDone={finishReading} />
        ) : stage === 'recommended' ? (
          <RecommendedState onContinue={startReading} onReady={finishReading} busy={startBusy || busy} />
        ) : stage === 'next-action' && currentMission ? (
          <NextActionState conceptName={currentMission.concept_name} onAction={() => void completeMission()} busy={busy} />
        ) : stage === 'boundary' ? (
          <BoundaryStateView subjectCompleted={Boolean(boundaryResult?.subject_completed)} onContinue={continueFromBoundary} busy={busy} />
        ) : selectedSubjectComplete ? (
          <SubjectCompleteState subjectName={selectedSubject?.subject_name ?? 'This subject'} onChooseAnother={openSubjectMenu} />
        ) : currentMission ? (
          <>
            <div style={{ minWidth: 0 }}>
              <p style={styles.stage}>{copy.lead}</p>
              <h1 style={styles.title}>{currentMission.action_type === 'READ' ? 'Read ' : ''}{currentMission.concept_name}</h1>
              <p style={styles.detail}>{currentMission.concept_description ?? copy.detail}</p>
              <div style={styles.meta}>
                <Clock3 size={14} aria-hidden='true' />
                <span>{currentMission.estimated_minutes} min</span>
              </div>
            </div>
            <button style={styles.primary} onClick={startReading} disabled={startBusy || busy}>
              {startBusy ? 'Starting…' : copy.cta} <span aria-hidden='true'>→</span>
            </button>
          </>
        ) : null}
      </article>
      <style>{`
        button:disabled { opacity: .55; cursor: not-allowed; }
        button:focus-visible { outline: 3px solid rgba(63,183,255,.50); outline-offset: 2px; }
        button:not(:disabled):hover { filter: brightness(1.06); }
        button:not(:disabled):active { transform: translateY(1px); }
        .nba-chevron-open { transform: rotate(180deg); }
        .nba-cta-row { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 18px; }
        @media (min-width: 640px) { .nba-cta-row { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (prefers-reduced-motion: reduce) { .nba-chevron-open { transition: none; } button { scroll-behavior: auto; } }
      `}</style>
    </MissionShell>
  )
}

function MissionShell({ children }: { children: React.ReactNode }) {
  return <section style={styles.shell}><div style={{ width: '100%', maxWidth: 620, minWidth: 0, margin: '0 auto' }}>{children}</div></section>
}
function RecommendedState({ onContinue, onReady, busy }: { onContinue: () => void; onReady: () => void; busy: boolean }) {
  return <><p style={styles.stage}>Recommended time reached</p><h2 style={styles.title}>You can keep reading.</h2><p style={styles.support}>You’ve reached the recommended reading window. Continue if you need more time, or move on when you’re ready.</p><div style={styles.boundary}>Recommended window reached · Extra reading continues without changing the recommendation.</div><div className='nba-cta-row'><button style={styles.primary} onClick={onContinue} disabled={busy}>{busy ? 'Continuing…' : 'Continue Reading'} <span aria-hidden='true'>→</span></button><button style={styles.textButton} onClick={onReady} disabled={busy}>{busy ? 'Please wait…' : 'I’m Ready'} <span aria-hidden='true'>→</span></button></div></>
}
function NextActionState({ conceptName, onAction, busy }: { conceptName: string; onAction: () => void; busy: boolean }) {
  return <><p style={styles.stage}>Ready for recall</p><h2 style={styles.title}>Quick recall on {conceptName}</h2><p style={styles.support}>Check what you can retrieve before moving on.</p><div style={styles.meta}><span>Recall</span><span>·</span><span>Next in progression</span></div><button style={styles.primary} onClick={onAction} disabled={busy}>{busy ? 'Saving…' : 'Complete Concept'} <span aria-hidden='true'>→</span></button></>
}
function BoundaryStateView({ subjectCompleted, onContinue, busy }: { subjectCompleted: boolean; onContinue: () => void; busy: boolean }) {
  return <><p style={styles.stage}>Subject completed</p><h2 style={styles.title}>You’ve completed this subject.</h2><p style={styles.support}>{subjectCompleted ? 'Continue to another scheduled subject when you’re ready.' : 'More work is available in today’s focus.'}</p><div className='nba-cta-row'><button style={styles.primary} onClick={onContinue} disabled={busy}>{busy ? 'Continuing…' : 'Continue'} <span aria-hidden='true'>→</span></button></div></>
}
function SubjectCompleteState({ subjectName, onChooseAnother }: { subjectName: string; onChooseAnother: () => void }) {
  return <><p style={styles.stage}>Subject complete</p><h2 style={styles.title}>No more concepts here today.</h2><p style={styles.support}>{subjectName} has no remaining concept in today’s focus. Choose another scheduled subject to continue.</p><button style={styles.secondary} onClick={onChooseAnother}>Choose another subject</button></>
}
