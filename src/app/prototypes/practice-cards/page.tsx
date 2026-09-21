import type { CSSProperties } from 'react'

type Mode = {
  name: string
  description: string
  detail: string
  state: 'Available' | 'Locked'
  accent: string
  accentMid: string
  accentDark: string
  meta: string[]
}

const modes: Mode[] = [
  {
    name: 'Quickfire',
    description: 'Keep your recall sharp with a short mixed session.',
    detail: 'Fast mixed practice for maintaining accuracy and keeping recently learned material active.',
    state: 'Available',
    accent: '#236BC5',
    accentMid: '#0D376C',
    accentDark: '#061B38',
    meta: ['20 questions', '15 minutes'],
  },
  {
    name: 'Campaign',
    description: 'Strengthen one topic at a time and build deeper understanding.',
    detail: 'Focus your effort where it matters. Work through a topic deliberately instead of practicing at random.',
    state: 'Available',
    accent: '#4A4FB1',
    accentMid: '#24275E',
    accentDark: '#101535',
    meta: ['Topic-focused', 'Flexible timing'],
  },
  {
    name: 'Sudden Death',
    description: 'Pressure-test your accuracy when every answer matters.',
    detail: 'Built for pressure training after you have established enough practice evidence.',
    state: 'Locked',
    accent: '#536477',
    accentMid: '#273542',
    accentDark: '#111A23',
    meta: ['1 mistake ends it', 'Unlocks later'],
  },
  {
    name: 'JAMB Simulation',
    description: 'Test your readiness under realistic exam conditions.',
    detail: 'A full-session pressure test designed to reveal how your preparation holds up when the conditions become real.',
    state: 'Locked',
    accent: '#536477',
    accentMid: '#273542',
    accentDark: '#111A23',
    meta: ['180 questions', '2 hours'],
  },
]

const icons: Record<string, React.ReactNode> = {
  Quickfire: <path d="M13 2 3 14h8l-1 8 11-14h-8l0-6Z" />,
  Campaign: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" /></>,
  'Sudden Death': <><path d="M12 3 20 6v5c0 5-3.2 8.2-8 10-4.8-1.8-8-5-8-10V6l8-3Z" /><path d="M12 8v5M12 16h.01" /></>,
  'JAMB Simulation': <><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3" /></>,
}

function Icon({ children }: { children: React.ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
}

export default function PracticeCardsPrototype() {
  return (
    <main className="practice-page">
      <div className="practice-wrap">
        <header className="practice-header">
          <div className="eyebrow">Practice</div>
          <h1>Choose how you want to train.</h1>
          <p>Each mode trains a different part of your preparation.</p>
        </header>

        <section className="practice-grid" aria-label="Practice modes">
          {modes.map((mode) => (
            <article
              key={mode.name}
              className={`practice-card ${mode.state === 'Locked' ? 'locked' : ''}`}
              style={{
                '--accent': mode.accent,
                '--accent-mid': mode.accentMid,
                '--accent-dark': mode.accentDark,
              } as CSSProperties}
            >
              <div className="card-visual">
                <div className="card-grid" />
                <div className="card-orbit" />

                <div className="card-content">
                  <div className="card-top">
                    <span className="mode-label">
                      <span className="mode-icon"><Icon>{icons[mode.name]}</Icon></span>
                      {mode.state === 'Locked' && mode.name === 'JAMB Simulation' ? 'Exam Mode' : mode.name === 'Sudden Death' ? 'Pressure' : 'Practice'}
                    </span>

                    <span className="availability">
                      <span className="status-dot" />
                      {mode.state}
                    </span>
                  </div>

                  <div className="card-bottom">
                    <div>
                      <h2>{mode.name}</h2>
                      <p>{mode.description}</p>
                    </div>

                    <div className="meta">
                      {mode.meta.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div className="card-detail">
                  <div className="detail-marker" />
                  <div>
                    <p>{mode.detail}</p>
                    {mode.state === 'Locked' && (
                      <div className="locked-reason">
                        <Icon><circle cx="12" cy="12" r="9" /><path d="M12 10v5M12 7h.01" /></Icon>
                        {mode.name === 'Sudden Death'
                          ? 'Complete more practice to unlock this mode.'
                          : 'Unlocks as your preparation progresses.'}
                      </div>
                    )}
                  </div>
                </div>

                <button className="launch-btn" disabled={mode.state === 'Locked'}>
                  <span className="button-icon">
                    <Icon>
                      {mode.state === 'Locked'
                        ? <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>
                        : <path d="m9 6 10 6-10 6V6Z" />}
                    </Icon>
                  </span>

                  {mode.state === 'Locked' ? 'Locked · See requirement' : `Start ${mode.name}`}

                  {mode.state === 'Available' && (
                    <span className="button-icon">
                      <Icon><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
                    </span>
                  )}
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>

      <style>{`
        .practice-page {
          --bg: #050B13;
          --text: #EEF4F8;
          --muted: #91A0B0;
          min-height: 100vh;
          padding: 32px 16px 56px;
          color: var(--text);
          background:
            radial-gradient(circle at 50% -10%, rgba(35,107,197,.11), transparent 40%),
            var(--bg);
          font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .practice-wrap {
          width: min(100%, 900px);
          margin: 0 auto;
        }

        .practice-header { margin-bottom: 25px; }
        .eyebrow {
          margin-bottom: 7px;
          color: #3FB7FF;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .10em;
          text-transform: uppercase;
        }

        .practice-header h1 {
          margin: 0;
          color: #EEF4F8;
          font-family: var(--font-geist-sans), Inter, sans-serif;
          font-size: 30px;
          line-height: 1.08;
          font-weight: 600;
          letter-spacing: -.035em;
        }

        .practice-header p {
          max-width: 350px;
          margin: 8px 0 0;
          color: #91A0B0;
          font-size: 13px;
          line-height: 1.55;
        }

        .practice-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .practice-card {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.085);
          border-radius: 22px;
          background: #101A26;
          box-shadow: 0 18px 45px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.055);
          transition: transform .18s ease, border-color .18s ease;
        }

        .practice-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,.13);
        }

        .card-visual {
          position: relative;
          min-height: 190px;
          overflow: hidden;
          isolation: isolate;
          background:
            linear-gradient(115deg, rgba(255,255,255,.15), rgba(255,255,255,.045) 15%, transparent 32%),
            repeating-linear-gradient(115deg, rgba(255,255,255,.026) 0 1px, transparent 1px 6px),
            linear-gradient(145deg, var(--accent) 0%, var(--accent) 38%, var(--accent-mid) 68%, var(--accent-dark) 100%);
        }

        .card-visual::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,.13) 70%, rgba(0,0,0,.30));
          pointer-events: none;
        }

        .card-visual::after {
          content: "";
          position: absolute;
          top: 0;
          left: 7%;
          right: 7%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.58), transparent);
          opacity: .75;
        }

        .card-grid {
          position: absolute;
          inset: 0;
          opacity: .075;
          background-image: linear-gradient(rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.22) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: linear-gradient(135deg, black, transparent 75%);
        }

        .card-orbit {
          position: absolute;
          width: 220px;
          height: 220px;
          right: -108px;
          bottom: -135px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 50%;
        }

        .card-orbit::before {
          content: "";
          position: absolute;
          inset: 22px;
          border: 1px solid rgba(255,255,255,.075);
          border-radius: 50%;
        }

        .card-orbit::after {
          content: "";
          position: absolute;
          inset: 48px;
          border: 1px solid rgba(255,255,255,.045);
          border-radius: 50%;
        }

        .card-content {
          position: relative;
          z-index: 2;
          min-height: 190px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .card-top, .card-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .card-bottom { align-items: flex-end; }

        .mode-label {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 10px;
          border: 1px solid rgba(255,255,255,.18);
          border-radius: 999px;
          background: rgba(0,0,0,.18);
          color: rgba(255,255,255,.90);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: .055em;
          text-transform: uppercase;
        }

        .mode-icon, .button-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        svg {
          width: 15px;
          height: 15px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .availability {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,.70);
          font-size: 10px;
          font-weight: 500;
          white-space: nowrap;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          box-shadow: 0 0 8px currentColor;
        }

        .card-bottom h2 {
          margin: 0;
          color: #fff;
          font-family: var(--font-geist-sans), Inter, sans-serif;
          font-size: 27px;
          line-height: 1.05;
          font-weight: 600;
          letter-spacing: -.035em;
        }

        .card-bottom p {
          max-width: 245px;
          margin: 7px 0 0;
          color: rgba(255,255,255,.68);
          font-size: 12px;
          line-height: 1.45;
        }

        .meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 7px;
          flex-shrink: 0;
        }

        .meta span {
          color: rgba(255,255,255,.78);
          font-size: 10px;
          white-space: nowrap;
        }

        .card-body {
          position: relative;
          padding: 17px 16px 16px;
          background:
            repeating-linear-gradient(105deg, rgba(255,255,255,.018) 0 1px, transparent 1px 5px),
            linear-gradient(145deg, #172330, #101B27 44%, #0B151F);
          border-top: 1px solid rgba(255,255,255,.07);
        }

        .card-detail {
          display: flex;
          align-items: stretch;
          gap: 10px;
          margin-bottom: 16px;
        }

        .detail-marker {
          width: 3px;
          min-height: 40px;
          flex-shrink: 0;
          border-radius: 999px;
          background: linear-gradient(180deg, var(--accent), var(--accent-dark));
        }

        .card-detail p {
          margin: 0;
          color: #91A0B0;
          font-size: 12px;
          line-height: 1.6;
        }

        .launch-btn {
          position: relative;
          width: 100%;
          min-height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          overflow: hidden;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--accent), var(--accent-dark));
          color: #fff;
          font: 600 13px Inter, sans-serif;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.13), 0 7px 18px rgba(0,0,0,.25);
        }

        .launch-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,.12), transparent 50%);
          pointer-events: none;
        }

        .launch-btn:disabled {
          cursor: not-allowed;
          background: linear-gradient(135deg, #1C3043, #101C27);
          color: #8493A2;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
        }

        .locked .card-visual {
          filter: saturate(.52) brightness(.72);
        }

        .locked .card-body {
          background:
            repeating-linear-gradient(105deg, rgba(255,255,255,.012) 0 1px, transparent 1px 5px),
            linear-gradient(145deg, #151E28, #0D151E);
        }

        .locked-reason {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          margin-top: 7px;
          color: #687889;
          font-size: 11px;
          line-height: 1.45;
        }

        .locked-reason svg {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        @media (max-width: 650px) {
          .practice-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 380px) {
          .practice-page { padding-inline: 12px; }
          .practice-header h1 { font-size: 27px; }
          .card-content { padding: 18px; }
          .card-bottom h2 { font-size: 25px; }
          .meta { display: none; }
        }
      `}</style>
    </main>
  )
}
