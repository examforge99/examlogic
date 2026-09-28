'use client'

import { useEffect, useState } from 'react'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

type Stage = 'ready' | 'reading' | 'recommended' | 'next-action'

type Notice = 'none' | 'reading-info'
type Action = 'READ' | 'RECALL' | 'PRACTICE'

const actionCopy: Record<Action, { lead: string; title: string; detail: string; metric: string; cta: string }> = {
  READ: {
    lead: 'Start here today.',
    title: 'Read through Motion',
    detail: 'Uniform motion • Displacement • Speed',
    metric: '~12 min',
    cta: 'Start Reading',
  },
  RECALL: {
    lead: 'Done reading? Quick check.',
    title: 'Recall Motion',
    detail: 'Key ideas before you move on',
    metric: '10 questions',
    cta: 'Start Recall',
  },
  PRACTICE: {
    lead: 'Time to test yourself.',
    title: 'Practice Motion',
    detail: '10 JAMB-style questions',
    metric: '10 questions',
    cta: 'Start Practice',
  },
}

export default function NBASessionPrototype() {
  const [action, setAction] = useState<Action>('READ')
  const [stage, setStage] = useState<Stage>('ready')
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [notice, setNotice] = useState<Notice>('none')
  const [seconds, setSeconds] = useState(12 * 60)
  const copy = actionCopy[action]

  useEffect(() => {
    if (stage !== 'reading' || action !== 'READ') return

    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [stage, action])

  useEffect(() => {
    if (stage === 'reading' && seconds === 0) {
      setStage('recommended')
    }
  }, [seconds, stage])

  const startReading = () => {
    setDisclaimerOpen(false)
    setNotice('reading-info')
    setStage('reading')
    setSeconds(12 * 60)
    window.setTimeout(() => {
      setNotice('none')
    }, 7000)
  }

  const finishReading = () => {
    setAction('RECALL')
    setStage('next-action')
  }

  const primaryAction = () => {
    if (stage === 'ready') startReading()
    else if (stage === 'recommended') finishReading()
    else if (stage === 'next-action') setAction('PRACTICE')
  }

  return (
    <main className="nba-prototype">
      <div className="dashboard">
        <header className="topbar">
          <span className="brand">ExamLogic</span>
          <span className="context">Dashboard</span>
        </header>

        {notice === 'reading-info' && (
          <div className="reading-transition" role="status" aria-live="polite">
            <div className="transition-inner">
              <span className="transition-kicker">Before you begin</span>
              <strong>Your focus is set.</strong>
              <p>ExamLogic provides the focus and recommended timing, not the learning material. Use your own textbook, notes, tutorial, or preferred study material.</p>
            </div>
          </div>
        )}

        <article className="nba-card" aria-label="Next Best Action">
          <div className="card-topline">
            <span className="identity-tag nba-tag">NBA</span>
            <span className="identity-tag subject-tag">PHYSICS</span>
          </div>

          {stage === 'reading' ? (
            <ReadingState
              seconds={seconds}
              onDone={finishReading}
            />
          ) : stage === 'recommended' ? (
            <RecommendedState
              onContinue={startReading}
              onReady={finishReading}
            />
          ) : stage === 'next-action' ? (
            <NextActionState
              copy={copy}
              onAction={primaryAction}
            />
          ) : (
            <ReadyState copy={copy} onAction={primaryAction} />
          )}

          {stage !== 'reading' && (
            <div className="disclaimer">
              <button
                className="disclaimer-toggle"
                aria-expanded={disclaimerOpen}
                aria-controls="nba-disclaimer"
                onClick={() => setDisclaimerOpen((open) => !open)}
              >
                <span className="disclaimer-label"><span className="info-mark">i</span> About this recommendation</span>
                <span className={`chevron ${disclaimerOpen ? 'open' : ''}`}>⌄</span>
              </button>

              {disclaimerOpen && (
                <div id="nba-disclaimer" className="disclaimer-body">
                  <p>
                    The recommended time gives you a focused window for this concept. It is not a deadline or a measure of mastery.
                  </p>
                  <p>
                    ExamLogic provides the focus and recommended timing, not the learning material. Use your textbook, notes, tutorial, or preferred study material.
                  </p>
                </div>
              )}
            </div>
          )}
        </article>

        <p className="dashboard-note">
          NBA stays here and changes as your next action changes.
        </p>

        <div className="prototype-controls" aria-label="Prototype controls">
          <span>Preview state</span>
          <button onClick={() => { setAction('READ'); setStage('ready') }}>Read</button>
          <button onClick={() => { setAction('RECALL'); setStage('next-action') }}>Recall</button>
          <button onClick={() => { setAction('PRACTICE'); setStage('next-action') }}>Practice</button>
        </div>
      </div>

      <style>{`
        .nba-prototype {
          min-height:100vh;
          margin:0;
          padding:18px 14px 50px;
          background:
            radial-gradient(circle at 50% 0%, rgba(63,183,255,.12), transparent 34%),
            #071426;
          color:var(--color-text-primary);
          font-family:${inter.style.fontFamily};
        }

        .dashboard { width:min(100%, 620px); margin:0 auto; padding-top:5vh; }

        .topbar {
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin-bottom:14px;
          padding:0 2px;
        }

        .brand {
          color:#E8F0F7;
          font-family:${inter.style.fontFamily};
          font-size:16px;
          font-weight:700;
          letter-spacing:-.025em;
        }

        .context { color:var(--color-text-secondary); font-size:11px; }

        .nba-card {
          position:relative;
          overflow:hidden;
          padding:21px;
          border:1px solid var(--color-border);
          border-radius:14px;
          background:var(--color-surface);
          box-shadow:var(--shadow-card);
        }

        .nba-card::before {
          content:"";
          position:absolute;
          top:0;
          left:10%;
          right:10%;
          height:1px;
          background:linear-gradient(90deg, transparent, rgba(63,183,255,.28), transparent);
        }

        .card-topline {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          margin-bottom:24px;
        }

        .identity-tag {
          display:inline-flex;
          align-items:center;
          min-height:28px;
          padding:0 11px;
          border:1px solid rgba(255,255,255,.16);
          border-radius:8px;
          background:rgba(255,255,255,.025);
          color:var(--color-text-primary);
          font-size:10px;
          font-weight:800;
          letter-spacing:.13em;
          line-height:1;
        }
        .nba-tag {
          border-color:rgba(63,183,255,.34);
          background:rgba(63,183,255,.06);
          color:var(--color-primary);
        }
        .subject-tag {
          border-color:rgba(255,255,255,.13);
        }

        .subject { color:rgba(232,240,247,.55); font-size:11px; font-weight:700; }

        .stage-label {
          margin:0 0 8px;
          color:rgba(232,240,247,.62);
          font-size:13px;
          line-height:1.4;
        }

        h1, h2 {
          margin:0;
          font-family:${inter.style.fontFamily};
          font-weight:700;
          letter-spacing:-.045em;
          line-height:1.04;
        }

        h1 { max-width:560px; font-size:clamp(31px, 8vw, 44px); }
        h2 { font-size:26px; }

        .detail, .support {
          max-width:530px;
          margin:13px 0 0;
          color:rgba(232,240,247,.57);
          font-size:13px;
          line-height:1.6;
        }

        .meta {
          display:flex;
          flex-wrap:wrap;
          gap:7px;
          margin-top:18px;
        }

        .meta span {
          padding:7px 9px;
          border:1px solid rgba(63,183,255,.20);
          border-radius:8px;
          background:rgba(7,20,38,.24);
          color:rgba(232,240,247,.58);
          font-size:11px;
          line-height:1;
        }

        .primary {
          width:100%;
          min-height:50px;
          margin-top:23px;
          border:1px solid var(--color-primary);
          border-radius:var(--radius);
          background:var(--color-primary);
          color:#06182A;
          font:700 13px ${inter.style.fontFamily}, system-ui, sans-serif;
          cursor:pointer;
        }

        .primary span { margin-left:7px; }

        .primary:hover { filter:brightness(1.06); }

        .secondary {
          width:100%;
          min-height:50px;
          margin-top:22px;
          border:1px solid rgba(63,183,255,.60);
          border-radius:12px;
          background:transparent;
          color:var(--color-primary);
          font:800 13px Inter, "Segoe UI", system-ui, sans-serif;
          cursor:pointer;
        }

        .secondary:hover { background:rgba(63,183,255,.09); }

        button:focus-visible {
          outline:2px solid #3FB7FF;
          outline-offset:3px;
        }

        .timer {
          margin-top:23px;
          font-size:clamp(50px, 13vw, 76px);
          font-weight:700;
          letter-spacing:-.06em;
          line-height:.95;
          font-variant-numeric:tabular-nums;
        }

        .progress {
          height:4px;
          margin-top:19px;
          overflow:hidden;
          border-radius:999px;
          background:rgba(232,240,247,.1);
        }

        .progress span {
          display:block;
          height:100%;
          border-radius:inherit;
          background:var(--color-primary);
          transition:width 1s linear;
        }

        .reading-actions {
          display:grid;
          gap:8px;
          margin-top:18px;
        }

        .reading-actions .secondary { margin-top:0; }

        .text-button {
          border:0;
          background:transparent;
          color:rgba(232,240,247,.48);
          font:700 11px Inter, "Segoe UI", system-ui, sans-serif;
          cursor:pointer;
        }

        .boundary {
          margin-top:18px;
          padding:10px 11px;
          border:1px solid rgba(232,240,247,.08);
          border-radius:var(--radius-sm);
          background:rgba(7,20,38,.24);
          color:rgba(232,240,247,.5);
          font-size:11px;
          line-height:1.5;
        }

        .cta-row {
          display:grid;
          gap:8px;
          margin-top:22px;
        }

        .cta-row .primary { margin-top:0; }

        .reading-transition {
          position:fixed;
          z-index:50;
          top:0;
          left:0;
          right:0;
          display:flex;
          justify-content:center;
          pointer-events:none;
          animation:dropFromTop 3s cubic-bezier(.22,.75,.2,1) forwards;
        }

        .transition-inner {
          width:min(100% - 28px, 620px);
          margin-top:14px;
          padding:16px 17px;
          border:1px solid var(--color-border);
          border-radius:var(--radius-lg);
          background:var(--color-surface);
          box-shadow:0 18px 45px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.06);
        }
        .transition-kicker {
          display:block;
          margin-bottom:5px;
          color:var(--color-primary);
          font-size:9px;
          font-weight:800;
          letter-spacing:.14em;
          text-transform:uppercase;
        }
        .reading-transition strong { display:block; font-size:15px; letter-spacing:-.02em; }
        .reading-transition p { margin:6px 0 0; color:rgba(232,240,247,.55); font-size:11px; line-height:1.55; }

        .disclaimer {
          margin-top:17px;
          border-top:1px solid rgba(232,240,247,.09);
        }

        .disclaimer-toggle {
          display:flex;
          width:100%;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          padding:13px 0 4px;
          border:0;
          background:transparent;
          color:rgba(232,240,247,.46);
          font:600 11px Inter, "Segoe UI", system-ui, sans-serif;
          text-align:left;
          cursor:pointer;
        }

        .disclaimer-label { display:flex; align-items:center; gap:7px; }
        .info-mark {
          display:inline-flex; align-items:center; justify-content:center;
          width:15px; height:15px; border:1px solid rgba(232,240,247,.25); border-radius:50%;
          font-size:9px; font-weight:800;
        }
        .chevron {
          display:inline-block;
          font-size:15px;
          line-height:1;
          transition:transform .16s ease;
        }

        .chevron.open { transform:rotate(180deg); }

        .disclaimer-body {
          padding:8px 0 2px;
          color:rgba(232,240,247,.5);
          font-size:11px;
          line-height:1.6;
          animation:reveal .16s ease-out;
        }

        .disclaimer-body p { margin:0 0 8px; }
        .disclaimer-body p:last-child { margin-bottom:0; }

        .reading-info {
          display:flex;
          justify-content:space-between;
          gap:12px;
          margin-top:8px;
          color:rgba(232,240,247,.46);
          font-size:11px;
        }

        .dashboard-note {
          margin:10px 3px 0;
          color:rgba(232,240,247,.3);
          font-size:10px;
        }

        .prototype-controls {
          display:flex;
          flex-wrap:wrap;
          align-items:center;
          gap:6px;
          margin-top:28px;
          padding:10px;
          border:1px dashed rgba(232,240,247,.1);
          border-radius:12px;
          color:rgba(232,240,247,.35);
          font-size:10px;
        }

        .prototype-controls button {
          border:1px solid rgba(232,240,247,.12);
          border-radius:var(--radius-sm);
          padding:5px 8px;
          background:rgba(255,255,255,.035);
          color:rgba(232,240,247,.55);
          font-size:10px;
          cursor:pointer;
        }

        @keyframes dropFromTop {
          0% { opacity:0; transform:translateY(-110%); }
          12% { opacity:1; transform:translateY(0); }
          82% { opacity:1; transform:translateY(0); }
          100% { opacity:0; transform:translateY(-110%); }
        }

        @keyframes reveal {
          from { opacity:0; transform:translateY(-4px); }
          to { opacity:1; transform:translateY(0); }
        }

        @media (min-width:640px) {
          .nba-prototype { padding:24px 18px 60px; }
          .dashboard { padding-top:10vh; }
          .nba-card { padding:27px; }
          .primary, .secondary { width:auto; min-width:210px; padding-inline:22px; }
          .reading-actions { display:flex; align-items:center; }
          .reading-actions .secondary { flex:0 0 auto; }
        }
      `}</style>
    </main>
  )
}

function ReadyState({
  copy,
  onAction,
}: {
  copy: (typeof actionCopy)[Action]
  onAction: () => void
}) {
  return (
    <>
      <p className="stage-label">{copy.lead}</p>
      <h1>{copy.title}</h1>
      <p className="detail">{copy.detail}</p>
      <div className="meta">
        <span>Recommended {copy.metric}</span>
        <span>Today</span>
      </div>
      <button className="primary" onClick={onAction}>{copy.cta} <span>→</span></button>
    </>
  )
}

function ReadingState({
  seconds,
  onDone,
}: {
  seconds: number
  onDone: () => void
}) {
  const progress = Math.max(0, Math.min(100, (seconds / 720) * 100))

  return (
    <>
      <p className="stage-label">Reading Motion</p>
      <h2>Stay with the concept.</h2>
      <div className="timer">{formatTime(seconds)}</div>
      <div className="progress" aria-label={`${Math.round(progress)} percent of recommended reading time remaining`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="reading-info">
        <span>Recommended: 12 min</span>
        <span>Guide, not deadline</span>
      </div>
      <div className="reading-actions">
        <button className="secondary" onClick={onDone}>I'm Done Reading</button>
      </div>
    </>
  )
}

function RecommendedState({
  onContinue,
  onReady,
}: {
  onContinue: () => void
  onReady: () => void
}) {
  return (
    <>
      <p className="stage-label">Recommended time reached</p>
      <h2>You can keep reading.</h2>
      <p className="support">
        You've reached the recommended reading window. Continue if you need more time, or move on when you're ready.
      </p>
      <div className="boundary">
        Recommended: 12 min • Extra reading continues without changing the recommendation.
      </div>
      <div className="cta-row">
        <button className="primary" onClick={onContinue}>Continue Reading <span>→</span></button>
        <button className="text-button" onClick={onReady}>I'm Ready →</button>
      </div>
    </>
  )
}

function NextActionState({
  copy,
  onAction,
}: {
  copy: (typeof actionCopy)[Action]
  onAction: () => void
}) {
  return (
    <>
      <p className="stage-label">{copy.lead}</p>
      <h2>{copy.title}</h2>
      <p className="support">{copy.detail}</p>
      <div className="meta">
        <span>{copy.metric}</span>
        <span>Next in progression</span>
      </div>
      <button className="primary" onClick={onAction}>{copy.cta} <span>→</span></button>
    </>
  )
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
