'use client'

const styles = {
  card: {
    minHeight: 320,
    padding: 21,
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: 14,
    background: '#0D1B2E',
    boxShadow: '0 20px 40px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.06)',
  } as const,
  top: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 } as const,
  label: { minHeight: 28, display: 'inline-flex', alignItems: 'center', padding: '0 11px', border: '1px solid rgba(63,183,255,.34)', borderRadius: 8, color: '#3FB7FF', fontSize: 12, fontWeight: 800, letterSpacing: '.08em' } as const,
  skeleton: { borderRadius: 7, background: 'rgba(255,255,255,.08)' } as const,
}

export default function MissionLoading() {
  return (
    <div style={styles.card} role='status' aria-label='Loading today’s mission' aria-busy='true'>
      <div style={styles.top}>
        <span style={styles.label}>Today’s Mission</span>
        <span style={{ ...styles.skeleton, width: 96, height: 44 }} />
      </div>
      <div>
        <span className='nba-loading-skeleton' style={{ ...styles.skeleton, display: 'block', width: '46%', height: 24, marginBottom: 22 }} />
        <span className='nba-loading-skeleton' style={{ ...styles.skeleton, display: 'block', width: '78%', height: 29, marginBottom: 10 }} />
        <span className='nba-loading-skeleton' style={{ ...styles.skeleton, display: 'block', width: '52%', height: 29, marginBottom: 22 }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <span className='nba-loading-skeleton' style={{ ...styles.skeleton, width: 86, height: 30 }} />
          <span className='nba-loading-skeleton' style={{ ...styles.skeleton, width: 94, height: 30 }} />
        </div>
        <span className='nba-loading-skeleton' style={{ ...styles.skeleton, display: 'block', width: '100%', height: 50, borderRadius: 10 }} />
      </div>
      <style>{`
        .nba-loading-skeleton { animation: nba-shimmer 1.5s ease-in-out infinite; background: linear-gradient(90deg, rgba(255,255,255,.045) 25%, rgba(255,255,255,.09) 50%, rgba(255,255,255,.045) 75%); background-size: 200% 100%; }
        @keyframes nba-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (prefers-reduced-motion: reduce) { .nba-loading-skeleton { animation: none; } }
      `}</style>
    </div>
  )
}
