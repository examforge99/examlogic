'use client'

const styles = {
  card: { minHeight: 210, padding: 18, border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, background: '#0D1B2E', boxShadow: '0 20px 40px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.06)' } as const,
  kicker: { margin: '0 0 8px', color: 'rgba(232,240,247,.72)', fontSize: 12, lineHeight: 1.4 } as const,
  title: { margin: 0, color: '#F1F6FA', fontSize: 21, lineHeight: 1.15, letterSpacing: '-.025em' } as const,
  support: { margin: '10px 0 0', color: 'rgba(232,240,247,.68)', fontSize: 12, lineHeight: 1.6 } as const,
  button: { width: '100%', minHeight: 42, marginTop: 16, border: '1px solid #3FB7FF', borderRadius: 12, background: 'linear-gradient(105deg,#2766F3,#1E8CEB 52%,#1ED0A7)', color: '#06182A', fontSize: 12, fontWeight: 800, cursor: 'pointer' } as const,
}

export default function MissionError({ error, onRetry, busy = false }: { error: string | null; onRetry: () => void; busy?: boolean }) {
  return (
    <div style={styles.card} role='alert'>
      <p style={styles.kicker}>Today’s Mission</p>
      <h2 style={styles.title}>We couldn’t load today’s mission.</h2>
      <p style={styles.support}>{error ?? 'Something went wrong. Please try again.'}</p>
      <button style={styles.button} onClick={onRetry} disabled={busy} aria-busy={busy}>
        {busy ? 'Retrying…' : 'Try Again'} <span aria-hidden='true'>→</span>
      </button>
      <style>{`
        button:disabled { opacity: .55; cursor: not-allowed; }
        button:focus-visible { outline: 3px solid rgba(63,183,255,.55); outline-offset: 2px; }
        button:active:not(:disabled) { transform: translateY(1px); }
        @media (prefers-reduced-motion: reduce) { button { transition: none; } }
      `}</style>
    </div>
  )
}
