'use client'

import { useEffect, useState } from 'react'

type Action = 'READ' | 'RECALL' | 'PRACTICE' | 'REVIEW' | 'DRILL' | 'RELEARN'
type Stage = 'ready' | 'reading' | 'recommended' | 'next'

const ACTION_COPY: Record<Action, {
  kicker: string
  lead: string
  title: string
  detail: string
  metric: string
  cta: string
}> = {
  READ: {
    kicker: 'Next move',
    lead: 'Start here today.',
    title: 'Read through Motion',
    detail: 'Uniform motion • Displacement • Speed',
    metric: '~12 min',
    cta: 'Start Reading',
  },
  RECALL: {
    kicker: 'Next move',
    lead: 'Done reading? Quick check.',
    title: 'Recall Motion',
    detail: '10 questions • Show-answer recall',
    metric: '10 questions',
    cta: 'Start Recall',
  },
  PRACTICE: {
    kicker: 'Next move',
    lead: 'Time to test yourself.',
    title: 'Practice Motion',
    detail: '10 JAMB-style questions',
    metric: '10 questions',
    cta: 'Start Practice',
  },
  REVIEW: {
    kicker: 'Next move',
    lead: "Haven't touched this in a while.",
    title: 'Quick refresh on Motion',
    detail: 'Revisit the key ideas before moving on',
    metric: '~8 min',
    cta: 'Start Review',
  },
  DRILL: {
    kicker: 'Next move',
    lead: 'Exam is getting close.',
    title: 'JAMB-standard questions on Motion',
    detail: 'Focused exam practice',
    metric: '10 questions',
    cta: 'Start Drill',
  },
  RELEARN: {
    kicker: 'Next move',
    lead: 'Motion needs another look.',
    title: "Let's go again",
    detail: 'Revisit the concept before testing it',
    metric: '~10 min',
    cta: 'Start Relearn',
  },
}

export default function NbaPrototype() {
  const [action] = useState<Action>('READ')
  const [stage, setStage] = useState<Stage>('ready')
  const [openDisclaimer, setOpenDisclaimer] = useState(false)
  const [remaining, setRemaining] = useState(12 * 60)
  const [extraReading, setExtraReading] = useState(0)

  const copy = ACTION_COPY[action]

  useEffect(() => {
    if (stage !== 'reading' || action !== 'READ' || remaining <= 0) return

    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [stage, action, remaining])

  useEffect(() => {
    if (stage === 'reading' && remaining === 0) {
      setStage('recommended')
    }
  }, [remaining, stage])

  useEffect(() => {
    if (stage !== 'reading') return
    const timer = window.setInterval(() => {
      setExtraReading((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [stage])

  const startReading = () => {
    setStage('reading')
    setRemaining(12 * 60)
    setExtraReading(0)
    setOpenDisclaimer(false)
  }

  const finishReading = () => setStage('next')

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${String(secs).padStart(2, '0')}`
  }

  const handlePrimary = () => {
    if (action === 'READ' && stage === 'ready') startReading()
    else if (action === 'READ' && stage === 'recommended') finishReading()
    else setStage('next')
  }

  const isReading = action === 'READ'
  const progress = isReading ? Math.max(0, Math.min(100, (remaining / (12 * 60)) * 100)) : 0

  return (
    <main className="nba-page">
      <section className="nba-shell" aria-label="ExamLogic NBA card prototype">
        <article className="nba-card">
          <div className="nba-topline">
            <span className="nba-kicker">{stage === 'reading' ? 'Reading now' : copy.kicker}</span>
            <span className="nba-subject">Physics</span>
          </div>

          {stage === 'reading' && isReading && (
            <div className="reading-banner" role="status">
              <span className="banner-dot" aria-hidden="true" />
              ExamLogic sets your focus and recommended reading window. Use your textbook, notes, tutorial, or preferred study material to learn.
            </div>
          )}

          <div className="nba-content">
            {stage === 'reading' && isReading ? (
              <>
                <p className="stage-label">Reading Motion</p>
                <h1>{remaining === 0 ? 'Recommended time reached.' : 'Stay with the concept.'}</h1>
                <div className="timer">{formatTime(remaining)}</div>
                <div className="progress-track" aria-label={`${Math.round(progress)} percent of recommended reading time remaining`}>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <p className="support-copy">
                  The timer is a guide, not a deadline. You can finish when you are ready.
                </p>
              </>
            ) : stage === 'recommended' && isReading ? (
              <>
                <p className="stage-label">Recommended time reached</p>
                <h1>You can keep reading.</h1>
                <p className="support-copy">
                  You have reached the recommended reading window. Continue if you need more time, or move on when you are ready.
                </p>
                <div className="boundary-note">
                  <span>Recommended: 12 min</span>
                  <span>Extra reading is tracked separately</span>
                </div>
              </>
            ) : stage === 'next' && isReading ? (
              <>
                <p className="stage-label">Next move</p>
                <h1>Done reading? Quick check.</h1>
                <p className="support-copy">Recall the key ideas in Motion.</p>
                <div className="nba-meta">
                  <span>10 questions</span>
                  <span>Show-answer recall</span>
                </div>
              </>
            ) : (
              <>
                <p className="stage-label">{copy.lead}</p>
                <h1>{copy.title}</h1>
                <p>{copy.detail}</p>
                <div className="nba-meta">
                  <span>{copy.metric}</span>
                  <span>Today</span>
                </div>
              </>
            )}
          </div>

          {stage === 'reading' && isReading ? (
            <button className="nba-cta secondary" onClick={finishReading}>
              I'm Done Reading <span>→</span>
            </button>
          ) : stage === 'recommended' && isReading ? (
            <div className="cta-stack">
              <button className="nba-cta" onClick={() => setStage('reading')}>
                Continue Reading <span>→</span>
              </button>
              <button className="nba-link" onClick={finishReading}>I'm Ready →</button>
            </div>
          ) : (
            <button className="nba-cta" onClick={handlePrimary}>
              {stage === 'next' && isReading ? 'Start Recall' : copy.cta} <span>→</span>
            </button>
          )}

          <div className="disclaimer">
            <button
              className="disclaimer-toggle"
              aria-expanded={openDisclaimer}
              onClick={() => setOpenDisclaimer((value) => !value)}
            >
              <span>About recommended reading time</span>
              <span className={`chevron ${openDisclaimer ? 'open' : ''}`}>⌄</span>
            </button>

            {openDisclaimer && (
              <div className="disclaimer-body">
                <p>
                  The recommended time gives you a focused window for this concept. It is not a deadline or a measure of mastery.
                </p>
                <p>
                  ExamLogic provides the focus and recommended timing, not the learning material. Use your textbook, notes, tutorial, or preferred study material.
                </p>
              </div>
            )}
          </div>

          {stage === 'reading' && extraReading > 0 && (
            <span className="sr-only">Additional reading time tracked: {extraReading} seconds.</span>
          )}
        </article>
      </section>

      <style>{`
        .nba-page {
          min-height: 100vh;
          margin: 0;
          padding: 14px;
          background:
            radial-gradient(circle at 50% 0%, rgba(63,183,255,.12), transparent 34%),
            #071426;
          color: #E8F0F7;
          font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .nba-shell {
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
          padding-top: 10vh;
        }

        .nba-card {
          position: relative;
          overflow: hidden;
          padding: 22px;
          border: 1px solid rgba(37,214,162,.32);
          border-radius: 20px;
          background:
            linear-gradient(145deg, rgba(16,42,67,.98), rgba(15,49,63,.98) 62%, rgba(16,54,61,.98));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.07),
            0 22px 55px rgba(0,0,0,.22);
        }

        .nba-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(37,214,162,.7), transparent);
        }

        .nba-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 26px;
        }

        .nba-kicker {
          color: #25D6A2;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .15em;
          line-height: 1;
          text-transform: uppercase;
        }

        .nba-subject {
          color: rgba(232,240,247,.55);
          font-size: 11px;
          font-weight: 700;
        }

        .reading-banner {
          display: flex;
          gap: 9px;
          margin: -8px 0 22px;
          padding: 10px 11px;
          border: 1px solid rgba(63,183,255,.18);
          border-radius: 11px;
          background: rgba(7,20,38,.26);
          color: rgba(232,240,247,.68);
          font-size: 11px;
          line-height: 1.5;
          animation: slideDown .22s ease-out;
        }

        .banner-dot {
          flex: 0 0 6px;
          width: 6px;
          height: 6px;
          margin-top: 5px;
          border-radius: 50%;
          background: #3FB7FF;
        }

        .nba-content h1 {
          margin: 0;
          max-width: 570px;
          font-family: var(--font-geist-sans), Inter, sans-serif;
          font-size: clamp(31px, 8vw, 44px);
          font-weight: 700;
          line-height: 1.03;
          letter-spacing: -.045em;
        }

        .stage-label {
          margin: 0 0 8px;
          color: rgba(232,240,247,.62);
          font-size: 13px;
          line-height: 1.4;
        }

        .nba-content > p:not(.stage-label) {
          max-width: 540px;
          margin: 14px 0 0;
          color: rgba(232,240,247,.58);
          font-size: 13px;
          line-height: 1.6;
        }

        .nba-meta,
        .boundary-note {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 18px;
        }

        .nba-meta span,
        .boundary-note span {
          padding: 7px 9px;
          border: 1px solid rgba(37,214,162,.18);
          border-radius: 8px;
          background: rgba(7,20,38,.24);
          color: rgba(232,240,247,.58);
          font-size: 11px;
          line-height: 1;
        }

        .timer {
          margin-top: 26px;
          font-size: clamp(48px, 13vw, 76px);
          font-weight: 700;
          line-height: .95;
          letter-spacing: -.06em;
          font-variant-numeric: tabular-nums;
        }

        .progress-track {
          height: 4px;
          margin-top: 20px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(232,240,247,.1);
        }

        .progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #25D6A2;
          transition: width 1s linear;
        }

        .support-copy {
          max-width: 540px;
          margin: 14px 0 0;
          color: rgba(232,240,247,.55);
          font-size: 12px;
          line-height: 1.55;
        }

        .nba-cta {
          width: 100%;
          min-height: 50px;
          margin-top: 24px;
          border: 1px solid #25D6A2;
          border-radius: 12px;
          background: #25D6A2;
          color: #061C19;
          font: 800 13px var(--font-inter), Inter, sans-serif;
          letter-spacing: .005em;
          cursor: pointer;
          transition: transform .16s ease, filter .16s ease;
        }

        .nba-cta:hover {
          filter: brightness(1.06);
        }

        .nba-cta:active {
          transform: translateY(1px);
        }

        .nba-cta.secondary {
          background: transparent;
          color: #B8F8E8;
        }

        .nba-cta span {
          margin-left: 7px;
        }

        .cta-stack {
          display: grid;
          gap: 8px;
        }

        .nba-link {
          border: 0;
          background: transparent;
          color: rgba(232,240,247,.62);
          font: 700 12px var(--font-inter), Inter, sans-serif;
          cursor: pointer;
        }

        .nba-cta:focus-visible,
        .nba-link:focus-visible,
        .disclaimer-toggle:focus-visible {
          outline: 2px solid #3FB7FF;
          outline-offset: 3px;
        }

        .disclaimer {
          margin-top: 17px;
          border-top: 1px solid rgba(232,240,247,.09);
        }

        .disclaimer-toggle {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 0 4px;
          border: 0;
          background: transparent;
          color: rgba(232,240,247,.46);
          font: 600 11px var(--font-inter), Inter, sans-serif;
          text-align: left;
          cursor: pointer;
        }

        .chevron {
          display: inline-block;
          font-size: 15px;
          line-height: 1;
          transition: transform .16s ease;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        .disclaimer-body {
          padding: 8px 0 3px;
          color: rgba(232,240,247,.5);
          font-size: 11px;
          line-height: 1.6;
          animation: reveal .16s ease-out;
        }

        .disclaimer-body p {
          margin: 0 0 8px;
        }

        .disclaimer-body p:last-child {
          margin-bottom: 0;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-7px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes reveal {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (min-width: 640px) {
          .nba-page { padding: 18px; }
          .nba-shell { padding-top: 14vh; }
          .nba-card { padding: 28px; }
          .nba-cta { width: auto; min-width: 210px; padding-inline: 22px; }
        }
      `}</style>
    </main>
  )
}
