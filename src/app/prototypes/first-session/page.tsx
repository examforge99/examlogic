import type { CSSProperties } from 'react'

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#071426',
    color: '#D8E0E8',
    fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
    position: 'relative',
  },
  dashboard: {
    minHeight: '100vh',
    padding: '22px',
    filter: 'blur(5px)',
    opacity: 0.38,
    transform: 'scale(1.015)',
    userSelect: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '32px',
  },
  brand: {
    fontSize: '20px',
    fontWeight: 750,
    letterSpacing: '-0.04em',
  },
  brandAccent: {
    color: '#25D6A2',
  },
  notification: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#0D1B2E',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  content: {
    maxWidth: '760px',
    margin: '0 auto',
  },
  skeletonHeading: {
    width: '210px',
    height: '25px',
    borderRadius: '8px',
    background: '#0F1535',
    marginBottom: '12px',
  },
  skeletonLine: {
    width: '310px',
    height: '14px',
    borderRadius: '6px',
    background: '#0F1535',
    marginBottom: '28px',
  },
  skeletonCard: {
    height: '150px',
    background: '#0D1B2E',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    marginBottom: '14px',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'rgba(3, 8, 16, 0.62)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    zIndex: 10,
  },
  modal: {
    width: 'min(100%, 430px)',
    background: '#0D1B2E',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '24px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.48), 0 0 0 1px rgba(0,0,0,0.15)',
    padding: '30px',
  },
  mark: {
    width: '54px',
    height: '54px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '16px',
    background: '#168C73',
    color: '#FFFFFF',
    marginBottom: '28px',
    boxShadow: '0 10px 30px rgba(37,214,162,0.14)',
  },
  eyebrow: {
    color: '#25D6A2',
    fontSize: '12px',
    fontWeight: 750,
    letterSpacing: '0.11em',
    textTransform: 'uppercase',
    marginBottom: '11px',
  },
  title: {
    fontSize: '34px',
    lineHeight: 1.08,
    letterSpacing: '-0.045em',
    fontWeight: 760,
    maxWidth: '340px',
    marginBottom: '14px',
  },
  description: {
    color: '#7D8A9A',
    fontSize: '16px',
    lineHeight: 1.55,
    maxWidth: '350px',
    marginBottom: '30px',
  },
  info: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '24px',
  },
  infoItem: {
    padding: '17px 0',
  },
  infoItemSecond: {
    padding: '17px 0 17px 18px',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
  },
  infoLabel: {
    color: '#7D8A9A',
    fontSize: '12px',
    marginBottom: '5px',
  },
  infoValue: {
    fontSize: '15px',
    fontWeight: 650,
  },
  button: {
    width: '100%',
    minHeight: '56px',
    border: 0,
    borderRadius: '14px',
    background: '#25D6A2',
    color: '#061812',
    fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 750,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    boxShadow: '0 8px 24px rgba(37,214,162,0.16)',
  },
  footnote: {
    textAlign: 'center',
    color: '#5F6D7D',
    fontSize: '12px',
    lineHeight: 1.4,
    marginTop: '14px',
  },
}

export default function FirstSessionPrototype() {
  return (
    <main style={styles.page}>
      <section aria-hidden="true" style={styles.dashboard}>
        <header style={styles.header}>
          <div style={styles.brand}>
            Exam<span style={styles.brandAccent}>Logic</span>
          </div>
          <div style={styles.notification} />
        </header>

        <div style={styles.content}>
          <div style={styles.skeletonHeading} />
          <div style={styles.skeletonLine} />
          <div style={styles.skeletonCard} />
          <div style={styles.skeletonCard} />
          <div style={styles.skeletonCard} />
        </div>
      </section>

      <div style={styles.overlay}>
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="first-session-title"
          style={styles.modal}
        >
          <div style={styles.mark} aria-hidden="true">
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
            </svg>
          </div>

          <div style={styles.eyebrow}>Your first session</div>

          <h1 id="first-session-title" style={styles.title}>
            Your first session is ready.
          </h1>

          <p style={styles.description}>
            Let’s see where you’re starting from.
          </p>

          <div style={styles.info}>
            <div style={styles.infoItem}>
              <div style={styles.infoLabel}>Session</div>
              <div style={styles.infoValue}>Quick Fire</div>
            </div>

            <div style={styles.infoItemSecond}>
              <div style={styles.infoLabel}>Questions</div>
              <div style={styles.infoValue}>20 questions</div>
            </div>
          </div>

          <button type="button" style={styles.button}>
            Start First Session
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </button>

          <p style={styles.footnote}>
            Your first session will help establish your starting point.
          </p>
        </section>
      </div>
    </main>
  )
}
