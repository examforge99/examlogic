// src/app/prototypes/nba-card/page.tsx
'use client'

import { useEffect, useState } from 'react'

type Action = 'READ' | 'RECALL' | 'PRACTICE' | 'REVIEW' | 'DRILL' | 'RELEARN'
type Stage = 'ready' | 'reading' | 'recommended' | 'next'

const ACTION_COPY: Record<Action, {
  lead: string
  title: string
  detail: string
  reason: string
  metric: string
  secondaryMetric: string
  cta: string
}> = {
  READ: {
    lead: 'Start with the concept',
    title: 'Read Electromagnetic Induction',
    detail: 'Key ideas, definitions, and relationships',
    reason: 'This concept is next in your learning progression.',
    metric: '~12 min',
    secondaryMetric: 'Guided reading',
    cta: 'Start Reading',
  },
  RECALL: {
    lead: 'Test what stuck',
    title: 'Recall Electromagnetic Induction',
    detail: 'Show-answer recall on the key ideas',
    reason: 'You studied this recently. Let’s check what you can retrieve.',
    metric: '10 questions',
    secondaryMetric: 'Recall',
    cta: 'Start Recall',
  },
  PRACTICE: {
    lead: 'Time to test yourself',
    title: 'Practice Electromagnetic Induction',
    detail: 'JAMB-style questions focused on this topic',
    reason: 'Your accuracy in this topic has dropped recently.',
    metric: '10 questions',
    secondaryMetric: 'Medium',
    cta: 'Start Practice',
  },
  REVIEW: {
    lead: 'Bring it back',
    title: 'Review Electromagnetic Induction',
    detail: 'Revisit the ideas that need another pass',
    reason: 'This concept has not been revisited recently.',
    metric: '~8 min',
    secondaryMetric: 'Key ideas',
    cta: 'Start Review',
  },
  DRILL: {
    lead: 'Sharpen exam performance',
    title: 'Drill Electromagnetic Induction',
    detail: 'Focused exam-style practice',
    reason: 'You are close enough to the exam for targeted pressure practice.',
    metric: '10 questions',
    secondaryMetric: 'Exam focus',
    cta: 'Start Drill',
  },
  RELEARN: {
    lead: 'Rebuild the concept',
    title: 'Relearn Electromagnetic Induction',
    detail: 'Return to the core idea before testing it again',
    reason: 'Your recent attempts suggest the concept needs another learning pass.',
    metric: '~10 min',
    secondaryMetric: 'Relearn',
    cta: 'Start Relearn',
  },
}

export default function NbaPrototype() {
  const [action, setAction] = useState<Action>('PRACTICE')
  const [stage, setStage] = useState<Stage>('ready')
  const [openDisclaimer, setOpenDisclaimer] = useState(false)
  const [remaining, setRemaining] = useState(12 * 60)

  const copy = ACTION_COPY[action]
  const isReading = action === 'READ'

  useEffect(() => {
    if (stage !== 'reading' || !isReading || remaining <= 0) return

    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [stage, isReading, remaining])

  useEffect(() => {
    if (stage === 'reading' && remaining === 0) {
      setStage('recommended')
    }
  }, [remaining, stage])

  const startReading = () => {
    setStage('reading')
    setRemaining(12 * 60)
    setOpenDisclaimer(false)
  }

  const finishReading = () => setStage('next')

  const handlePrimary = () => {
    if (isReading && stage === 'ready') startReading()
    else if (isReading && stage === 'recommended') finishReading()
    else setStage('next')
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${String(secs).padStart(2, '0')}`
  }

  const progress = Math.max(0, Math.min(100, (remaining / (12 * 60)) * 100))

  return (
    <main className="nba-page">
      <section className="nba-shell">
        <article className="nba-card" aria-label="Next Best Action">
          <div className="card-glow" aria-hidden="true" />

          <header className="card-header">
            <div className="nba-heading">
              <span className="spark-mark" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>Next Best Action</span>
            </div>
            <span className="subject">Physics</span>
          </header>

          {stage === 'reading' && isReading ? (
            <>
              <div className="reading-notice" role="status">
                <span className="notice-dot" />
                Your focus is set. Use your textbook, notes, tutorial, or preferred study material.
              </div>

              <div className="reading-content">
                <span className="eyebrow">Reading now</span>
                <h1>Stay with the concept.</h1>
                <div className="timer">{formatTime(remaining)}</div>
                <div className="progress-track" aria-label={`${Math.round(progress)} percent of recommended reading time remaining`}>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <p className="muted">Recommended time is a guide, not a deadline.</p>
              </div>

              <button className="cta secondary" onClick={finishReading}>
                I’m Done Reading <span>→</span>
              </button>
            </>
          ) : stage === 'recommended' && isReading ? (
            <>
              <div className="content">
                <span className="eyebrow">Recommended time reached</span>
                <h1>You can keep reading.</h1>
                <p className="description">
                  You’ve reached the recommended reading window. Continue if you need more time, or move on when you’re ready.
                </p>
                <div className="boundary">
                  <span>Recommended: 12 min</span>
                  <span>Extra reading is tracked separately</span>
                </div>
              </div>

              <div className="cta-stack">
                <button className="cta" onClick={() => setStage('reading')}>
                  Continue Reading <span>→</span>
                </button>
                <button className="text-button" onClick={finishReading}>I’m Ready →</button>
              </div>
            </>
          ) : stage === 'next' && isReading ? (
            <>
              <div className="content">
                <span className="eyebrow">Next move</span>
                <h1>Recall Electromagnetic Induction</h1>
                <p className="description">Check the key ideas you just studied.</p>
                <div className="meta">
                  <span>10 questions</span>
                  <span>Recall</span>
                </div>
              </div>

              <button className="cta" onClick={() => {
                setAction('RECALL')
                setStage('ready')
              }}>
                Start Recall <span>→</span>
              </button>
            </>
          ) : (
            <>
              <div className="recommendation-row">
                <span className="recommendation-badge">
                  <span className="pulse-dot" />
                  Recommended for you
                </span>
              </div>

              <div className="recommendation-body">
                <div className="content">
                  <span className="eyebrow">{copy.lead}</span>
                  <h1>{copy.title}</h1>
                  <p className="description">{copy.reason}</p>

                  <div className="meta">
                    <span>{copy.metric}</span>
                    <span>{copy.secondaryMetric}</span>
                  </div>
                </div>

                <div className="topic-visual" aria-hidden="true">
                  <div className="visual-orbit orbit-one" />
                  <div className="visual-orbit orbit-two" />
                  <div className="magnet">
                    <span />
                    <span />
                  </div>
                  <div className="visual-spark spark-one" />
                  <div className="visual-spark spark-two" />
                </div>
              </div>

              <button className="cta" onClick={handlePrimary}>
                {copy.cta} <span>→</span>
              </button>
            </>
          )}

          <div className="disclaimer">
            <button
              className="disclaimer-toggle"
              aria-expanded={openDisclaimer}
              onClick={() => setOpenDisclaimer((value) => !value)}
            >
              <span>Why this is recommended</span>
              <span className={`chevron ${openDisclaimer ? 'open' : ''}`}>⌄</span>
            </button>

            {openDisclaimer && (
              <div className="disclaimer-body">
                <p>{copy.reason}</p>
                <p>ExamLogic uses your learning state to decide when an action is genuinely useful. A normal timetable item is shown as Today’s Mission instead.</p>
              </div>
            )}
          </div>
        </article>

        <div className="prototype-controls" aria-label="Prototype controls">
          <span>Preview intelligence state</span>
          {(['READ', 'RECALL', 'PRACTICE', 'REVIEW', 'DRILL', 'RELEARN'] as Action[]).map((item) => (
            <button
              key={item}
              className={action === item ? 'active' : ''}
              onClick={() => {
                setAction(item)
                setStage('ready')
                setOpenDisclaimer(false)
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <style>{`
        .nba-page {
          min-height: 100vh;
          padding: 28px 16px 60px;
          background:
            radial-gradient(circle at 50% -8%, rgba(63,183,255,.16), transparent 32%),
            radial-gradient(circle at 82% 44%, rgba(37,214,162,.07), transparent 28%),
            #071426;
          color: #E8F0F7;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .nba-shell {
          width: min(100%, 780px);
          margin: 0 auto;
          padding-top: 8vh;
        }

        .nba-card {
          position: relative;
          overflow: hidden;
          padding: 25px;
          border: 1px solid rgba(92,125,170,.36);
          border-radius: 25px;
          background:
            linear-gradient(142deg, rgba(13,27,46,.98) 0%, rgba(11,31,55,.98) 55%, rgba(13,38,54,.98) 100%);
          box-shadow:
            0 30px 80px rgba(0,0,0,.32),
            inset 0 1px 0 rgba(255,255,255,.065);
        }

        .nba-card::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(120deg, rgba(63,183,255,.05), transparent 42%, rgba(37,214,162,.045));
        }

        .card-glow {
          position: absolute;
          width: 270px;
          height: 270px;
          right: -80px;
          top: 75px;
          border-radius: 50%;
          background: rgba(91,72,255,.11);
          filter: blur(40px);
          pointer-events: none;
        }

        .card-header,
        .recommendation-row,
        .recommendation-body,
        .reading-content,
        .content,
        .cta,
        .cta-stack,
        .reading-notice,
        .disclaimer {
          position: relative;
          z-index: 1;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 25px;
        }

        .nba-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #F3F7FB;
          font-size: 17px;
          font-weight: 750;
          letter-spacing: -.025em;
        }

        .spark-mark {
          position: relative;
          display: block;
          width: 28px;
          height: 28px;
        }

        .spark-mark i {
          position: absolute;
          display: block;
          width: 12px;
          height: 12px;
          border-radius: 3px;
          background: linear-gradient(145deg, #D2A7FF, #8058FF);
          transform: rotate(45deg);
          box-shadow: 0 0 18px rgba(143,92,255,.4);
        }

        .spark-mark i:nth-child(1) { left: 8px; top: 8px; width: 15px; height: 15px; }
        .spark-mark i:nth-child(2) { left: 1px; top: 3px; width: 6px; height: 6px; }
        .spark-mark i:nth-child(3) { right: 0; bottom: 2px; width: 7px; height: 7px; }

        .subject {
          color: rgba(232,240,247,.52);
          font-size: 11px;
          font-weight: 750;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .recommendation-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 0 13px;
          border: 1px solid rgba(240,190,55,.15);
          border-radius: 12px;
          background: rgba(127,92,21,.22);
          color: #F0C94F;
          font-size: 12px;
          font-weight: 750;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #F0C94F;
          box-shadow: 0 0 12px rgba(240,201,79,.65);
        }

        .recommendation-body {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 220px;
          align-items: center;
          gap: 22px;
          margin-top: 25px;
        }

        .eyebrow {
          display: block;
          margin-bottom: 9px;
          color: rgba(232,240,247,.61);
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
        }

        h1 {
          max-width: 570px;
          margin: 0;
          color: #F1F6FA;
          font-size: clamp(30px, 5vw, 44px);
          font-weight: 720;
          letter-spacing: -.052em;
          line-height: 1.04;
        }

        .description {
          max-width: 540px;
          margin: 15px 0 0;
          color: rgba(232,240,247,.59);
          font-size: 13px;
          line-height: 1.58;
        }

        .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 19px;
        }

        .meta span {
          padding: 8px 10px;
          border: 1px solid rgba(63,183,255,.17);
          border-radius: 9px;
          background: rgba(5,16,30,.28);
          color: rgba(232,240,247,.64);
          font-size: 11px;
          font-weight: 650;
        }

        .topic-visual {
          position: relative;
          width: 205px;
          height: 205px;
          margin-left: auto;
          border: 1px solid rgba(122,103,255,.2);
          border-radius: 50%;
          background:
            radial-gradient(circle, rgba(106,75,230,.16), rgba(29,23,73,.08) 48%, transparent 69%);
          box-shadow:
            inset 0 0 35px rgba(107,73,255,.08),
            0 0 30px rgba(77,66,180,.08);
        }

        .visual-orbit {
          position: absolute;
          inset: 12%;
          border: 1px solid rgba(145,118,255,.2);
          border-radius: 50%;
        }

        .orbit-one { transform: rotate(42deg) scaleX(.62); }
        .orbit-two { transform: rotate(-42deg) scaleX(.62); }

        .magnet {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 72px;
          height: 82px;
          transform: translate(-50%, -42%);
          border: 12px solid #8C68F6;
          border-top: 0;
          border-radius: 0 0 34px 34px;
          box-shadow: 0 0 24px rgba(128,88,255,.35);
        }

        .magnet::before,
        .magnet::after {
          content: "";
          position: absolute;
          top: -18px;
          width: 20px;
          height: 25px;
          background: #A681FF;
          border-radius: 5px 5px 2px 2px;
        }

        .magnet::before { left: -12px; }
        .magnet::after { right: -12px; }

        .magnet span {
          position: absolute;
          top: 4px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #D4C5FF;
          box-shadow: 0 0 9px #B79EFF;
        }

        .magnet span:first-child { left: -35px; }
        .magnet span:last-child { right: -35px; }

        .visual-spark {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #BBA6FF;
          box-shadow: 0 0 12px #A27EFF;
        }

        .spark-one { top: 27px; left: 50px; }
        .spark-two { right: 34px; bottom: 46px; width: 4px; height: 4px; }

        .cta {
          width: 100%;
          min-height: 58px;
          margin-top: 27px;
          border: 0;
          border-radius: 15px;
          background: linear-gradient(105deg, #2766F3 0%, #1E8CEB 52%, #1ED0A7 100%);
          color: #F7FBFF;
          font: 800 15px Inter, ui-sans-serif, system-ui, sans-serif;
          letter-spacing: -.01em;
          cursor: pointer;
          box-shadow: 0 10px 28px rgba(22,118,224,.18), inset 0 1px 0 rgba(255,255,255,.18);
          transition: transform .16s ease, filter .16s ease;
        }

        .cta:hover { filter: brightness(1.06); }
        .cta:active { transform: translateY(1px); }
        .cta span { margin-left: 9px; font-size: 18px; }

        .cta.secondary {
          background: transparent;
          border: 1px solid rgba(63,183,255,.48);
          color: #A8DBFF;
          box-shadow: none;
        }

        .cta-stack {
          display: grid;
          gap: 9px;
        }

        .text-button {
          border: 0;
          background: transparent;
          color: rgba(232,240,247,.56);
          font: 700 12px Inter, ui-sans-serif, system-ui, sans-serif;
          cursor: pointer;
        }

        .reading-notice {
          display: flex;
          gap: 9px;
          margin: -7px 0 23px;
          padding: 10px 11px;
          border: 1px solid rgba(63,183,255,.17);
          border-radius: 11px;
          background: rgba(5,16,30,.3);
          color: rgba(232,240,247,.63);
          font-size: 11px;
          line-height: 1.5;
        }

        .notice-dot {
          flex: 0 0 6px;
          width: 6px;
          height: 6px;
          margin-top: 5px;
          border-radius: 50%;
          background: #3FB7FF;
        }

        .reading-content { margin-top: 4px; }

        .timer {
          margin-top: 24px;
          color: #F3F7FB;
          font-size: clamp(52px, 11vw, 76px);
          font-weight: 720;
          letter-spacing: -.065em;
          line-height: .95;
          font-variant-numeric: tabular-nums;
        }

        .progress-track {
          height: 5px;
          margin-top: 19px;
          overflow: hidden;
          border-radius: 99px;
          background: rgba(232,240,247,.09);
        }

        .progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #3479F6, #25D6A2);
          transition: width 1s linear;
        }

        .muted {
          margin: 12px 0 0;
          color: rgba(232,240,247,.48);
          font-size: 11px;
        }

        .boundary {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 19px;
        }

        .boundary span {
          padding: 8px 10px;
          border: 1px solid rgba(232,240,247,.09);
          border-radius: 9px;
          background: rgba(5,16,30,.25);
          color: rgba(232,240,247,.5);
          font-size: 11px;
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
          color: rgba(232,240,247,.43);
          font: 600 11px Inter, ui-sans-serif, system-ui, sans-serif;
          text-align: left;
          cursor: pointer;
        }

        .chevron {
          transition: transform .16s ease;
          font-size: 15px;
        }

        .chevron.open { transform: rotate(180deg); }

        .disclaimer-body {
          padding: 8px 0 3px;
          color: rgba(232,240,247,.48);
          font-size: 11px;
          line-height: 1.6;
        }

        .disclaimer-body p { margin: 0 0 8px; }
        .disclaimer-body p:last-child { margin-bottom: 0; }

        .prototype-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          margin-top: 22px;
          padding: 9px;
          border: 1px dashed rgba(232,240,247,.1);
          border-radius: 12px;
          color: rgba(232,240,247,.32);
          font-size: 10px;
        }

        .prototype-controls button {
          border: 1px solid rgba(232,240,247,.1);
          border-radius: 8px;
          padding: 6px 8px;
          background: rgba(255,255,255,.025);
          color: rgba(232,240,247,.52);
          font-size: 10px;
          cursor: pointer;
        }

        .prototype-controls button.active {
          border-color: rgba(63,183,255,.34);
          background: rgba(63,183,255,.08);
          color: #8CCFFF;
        }

        button:focus-visible {
          outline: 2px solid #3FB7FF;
          outline-offset: 3px;
        }

        @media (max-width: 680px) {
          .nba-shell { padding-top: 3vh; }
          .nba-card { padding: 19px; border-radius: 21px; }
          .recommendation-body { grid-template-columns: 1fr; }
          .topic-visual {
            width: 145px;
            height: 145px;
            margin: 4px 8px 0 auto;
          }
          .magnet { transform: translate(-50%, -42%) scale(.75); }
          .card-header { margin-bottom: 20px; }
          .nba-heading { font-size: 15px; }
          .recommendation-badge { font-size: 11px; }
        }

        @media (min-width: 681px) {
          .cta { max-width: 100%; }
        }
      `}</style>
    </main>
  )
}
