'use client'

import { useState } from 'react'
import MissionDisclaimer from './MissionDisclaimer'

type Action = 'READ' | 'RECALL' | 'PRACTICE' | 'REVIEW' | 'DRILL' | 'RELEARN'

const COPY: Record<Action, { label: string; button: string }> = {
  READ: { label: 'Reading this concept', button: 'I’m Done Reading' },
  RECALL: { label: 'Recalling this concept', button: 'I’m Done Recalling' },
  PRACTICE: { label: 'Working through this concept', button: 'I’m Done' },
  REVIEW: { label: 'Reviewing this concept', button: 'I’m Done Reviewing' },
  DRILL: { label: 'Working through this concept', button: 'I’m Done' },
  RELEARN: { label: 'Relearning this concept', button: 'I’m Done Relearning' },
}

const styles = {
  label: { margin: '0 0 8px', color: 'rgba(232,240,247,.72)', fontSize: 13, lineHeight: 1.4 } as const,
  concept: { display: 'inline-block', maxWidth: '100%', marginTop: 8, padding: '7px 11px', borderRadius: 10, background: 'rgba(245,194,66,.12)', border: '1px solid rgba(245,194,66,.28)', color: '#F5C242', fontSize: 14, fontWeight: 600, lineHeight: 1.35, overflowWrap: 'anywhere' } as const,
  timer: { marginTop: 20, color: '#F1F6FA', fontSize: 42, lineHeight: 1, fontWeight: 750, letterSpacing: '-.04em', fontVariantNumeric: 'tabular-nums' } as const,
  progress: { height: 7, marginTop: 16, overflow: 'hidden', borderRadius: 999, background: 'rgba(255,255,255,.08)' } as const,
  fill: { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#3FB7FF,#25D6A2)' } as const,
  info: { display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 10, color: 'rgba(232,240,247,.68)', fontSize: 12 } as const,
  button: { width: '100%', minHeight: 50, marginTop: 22, border: '1px solid rgba(63,183,255,.60)', borderRadius: 12, background: 'transparent', color: '#3FB7FF', fontSize: 13, fontWeight: 800, cursor: 'pointer' } as const,
}

export default function MissionReading({
  seconds,
  estimatedMinutes,
  conceptName,
  action = 'READ',
  onDone,
}: {
  seconds: number
  estimatedMinutes: number
  conceptName: string
  action?: Action
  onDone: () => void
}) {
  const [busy, setBusy] = useState(false)
  const progress = Math.max(0, Math.min(100, (seconds / Math.max(1, estimatedMinutes * 60)) * 100))
  const copy = COPY[action]

  function handleDone() {
    if (busy) return
    setBusy(true)
    onDone()
  }

  return (
    <>
      <p style={styles.label}>{copy.label}</p>
      <div style={styles.concept}>{conceptName}</div>
      <div style={styles.timer} aria-live='polite'>{formatTime(seconds)}</div>
      <div style={styles.progress} aria-hidden='true'><span style={{ ...styles.fill, display: 'block', width: progress + '%' }} /></div>
      <div style={styles.info}>
        <span>Recommended: {estimatedMinutes} min</span>
        <span>Guide, not deadline</span>
      </div>
      <div>
        <button style={styles.button} onClick={handleDone} disabled={busy}>
          {busy ? 'Saving…' : copy.button}
        </button>
      </div>
      <MissionDisclaimer />
      <style>{`
        button:disabled { opacity: .55; cursor: not-allowed; }
        button:focus-visible { outline: 3px solid rgba(63,183,255,.45); outline-offset: 2px; }
        button:active:not(:disabled) { transform: translateY(1px); }
        @media (prefers-reduced-motion: reduce) { button { transition: none; } }
      `}</style>
    </>
  )
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0')
}
