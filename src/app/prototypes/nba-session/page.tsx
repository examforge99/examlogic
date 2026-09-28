import { useState } from 'react'

type Stage = 'intro' | 'reading' | 'reading-complete' | 'next-action' | 'boundary'

export default function NBASessionPrototype() {
  const [stage, setStage] = useState<Stage>('intro')
  const [seconds, setSeconds] = useState(12 * 60)

  const startReading = () => {
    setStage('reading')
    setSeconds(12 * 60)
  }

  return (
    <main className="nba-prototype">
      <div className="shell">
        <header className="topbar">
          <span className="brand">ExamLogic</span>
          <span className="context">Today's focus</span>
        </header>

        <section className="hero">
          <p className="eyebrow">Next move</p>
          <div className="subject">Chemistry</div>
          <h1>Separation of Mixtures</h1>
          <p className="description">
            Start here. Read through this concept first.
          </p>
        </section>

        {stage === 'intro' && (
          <section className="card">
            <div className="notice">
              <span className="notice-line" />
              <div>
                <strong>Before you begin</strong>
                <p>
                  ExamLogic provides the focus and recommended timing, not the
                  learning material. Use your textbook, notes, tutorial, or
                  preferred study material.
                </p>
              </div>
            </div>
            <button className="primary" onClick={startReading}>
              Start Reading <span>→</span>
            </button>
          </section>
        )}

        {stage === 'reading' && (
          <section className="card reading-card">
            <div className="reading-top">
              <div>
                <p className="label">Recommended reading</p>
                <h2>{formatTime(seconds)}</h2>
              </div>
              <span className="pill">12 min guide</span>
            </div>

            <div className="progress">
              <span style={{ width: `${Math.max(0, (seconds / 720) * 100)}%` }} />
            </div>

            <p className="helper">
              This is a guide, not a deadline. Finish when you are ready.
            </p>

            <div className="actions">
              <button className="secondary" onClick={() => setStage('reading-complete')}>
                I'm Done Reading
              </button>
              <button className="ghost" onClick={() => setSeconds(0)}>
                Simulate time up
              </button>
            </div>
          </section>
        )}

        {stage === 'reading-complete' && (
          <section className="card">
            <p className="eyebrow">Reading complete</p>
            <h2>Ready for a quick check?</h2>
            <p className="description">
              Move into the next NBA action for this concept.
            </p>
            <button className="primary" onClick={() => setStage('next-action')}>
              Start Practice <span>→</span>
            </button>
          </section>
        )}

        {stage === 'next-action' && (
          <section className="card">
            <p className="eyebrow">Next action</p>
            <h2>Quick recall</h2>
            <p className="description">
              Check what you remember before moving on.
            </p>
            <button className="primary" onClick={() => setStage('boundary')}>
              Complete Concept <span>→</span>
            </button>
          </section>
        )}

        {stage === 'boundary' && (
          <section className="card">
            <p className="eyebrow">Session boundary</p>
            <h2>You’ve reached your study goal.</h2>
            <p className="description">
              More concepts are available in today’s scheduled scope.
            </p>
            <button className="primary" onClick={() => setStage('intro')}>
              Continue <span>→</span>
            </button>
            <button className="link-button" onClick={() => setStage('intro')}>
              End session
            </button>
          </section>
        )}

        <footer>
          <span>NBA surfaces one action at a time.</span>
          <span>Student controls continuation.</span>
        </footer>
      </div>

      <style>{`
        .nba-prototype {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% -15%, rgba(51, 183, 207, .10), transparent 38%),
            linear-gradient(145deg, #111A23 0%, #0D151E 55%, #101923 100%);
          color: #EEF3F5;
          font-family: var(--font-inter), Inter, system-ui, sans-serif;
          padding: 24px 16px 56px;
        }
        .shell { width: min(100%, 620px); margin: 0 auto; }
        .topbar {
          display:flex; justify-content:space-between; align-items:center;
          padding: 4px 2px 34px; color:#91A1AE; font-size:12px;
        }
        .brand { color:#EAF2F3; font-weight:650; letter-spacing:-.02em; font-size:16px; }
        .context { letter-spacing:.04em; }
        .hero { padding: 8px 4px 24px; }
        .eyebrow {
          margin:0 0 10px; color:#45B8BD; font-size:10px; font-weight:700;
          letter-spacing:.13em; text-transform:uppercase;
        }
        .subject { color:#AAB8C0; font-size:13px; margin-bottom:5px; }
        h1 {
          margin:0; font-family:var(--font-geist-sans), Inter, sans-serif;
          font-size:34px; line-height:1.05; letter-spacing:-.045em; font-weight:620;
        }
        h2 {
          margin:0; font-family:var(--font-geist-sans), Inter, sans-serif;
          font-size:25px; line-height:1.12; letter-spacing:-.035em; font-weight:620;
        }
        .description { color:#9AA8B4; font-size:13px; line-height:1.6; margin:10px 0 0; max-width:470px; }
        .card {
          border:1px solid rgba(255,255,255,.09); border-radius:22px;
          background:linear-gradient(145deg, rgba(29,43,55,.96), rgba(17,27,37,.98));
          box-shadow:0 20px 55px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.045);
          padding:20px;
        }
        .notice {
          display:flex; gap:12px; padding:14px; margin-bottom:18px;
          border-radius:15px; background:rgba(255,255,255,.035);
          border:1px solid rgba(255,255,255,.06);
        }
        .notice-line { width:3px; border-radius:4px; background:#45B8BD; flex-shrink:0; }
        .notice strong { font-size:12px; color:#DDE7EA; }
        .notice p { margin:5px 0 0; color:#91A1AE; font-size:11px; line-height:1.55; }
        button {
          border:0; font:inherit; cursor:pointer; transition:transform .16s ease, opacity .16s ease;
        }
        button:active { transform:translateY(1px); }
        .primary, .secondary {
          width:100%; min-height:48px; border-radius:14px; display:flex;
          align-items:center; justify-content:center; gap:10px; font-size:13px; font-weight:650;
        }
        .primary {
          color:#F4FBFC; background:linear-gradient(135deg,#3FAEB3,#226F77);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.15), 0 9px 24px rgba(0,0,0,.22);
        }
        .secondary { color:#E8F0F2; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.09); }
        .ghost { color:#71818E; background:transparent; font-size:11px; padding:8px 0; }
        .reading-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .label { margin:0 0 6px; color:#899AA7; font-size:11px; }
        .reading-top h2 { font-size:42px; letter-spacing:-.055em; font-variant-numeric:tabular-nums; }
        .pill {
          padding:7px 9px; border-radius:999px; color:#9FB0BA; background:rgba(255,255,255,.045);
          border:1px solid rgba(255,255,255,.06); font-size:10px;
        }
        .progress { height:5px; border-radius:99px; background:rgba(255,255,255,.06); overflow:hidden; margin:22px 0 10px; }
        .progress span { display:block; height:100%; background:#45B8BD; border-radius:inherit; transition:width .2s linear; }
        .helper { color:#81919D; font-size:11px; line-height:1.5; margin:0 0 18px; }
        .actions { display:grid; gap:8px; }
        .link-button { display:block; margin:13px auto 0; color:#778894; background:none; font-size:11px; }
        footer {
          display:flex; justify-content:space-between; gap:12px; padding:18px 4px 0;
          color:#667681; font-size:10px; line-height:1.4;
        }
        @media (max-width:520px) {
          .nba-prototype { padding-top:18px; }
          h1 { font-size:30px; }
          footer { flex-direction:column; }
        }
      `}</style>
    </main>
  )
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
