'use client'

import { useState } from 'react'

export default function NbaPrototype() {
  const [started, setStarted] = useState(false)

  return (
    <main className="nba-page">
      <section className="nba-shell" aria-label="ExamLogic dashboard prototype">
        <div className="nba-card">
          <div className="nba-kicker">Next best action</div>

          <div className="nba-content">
            <div>
              <h1>Complete Physics: Motion</h1>
              <p>Build stronger understanding where your recent practice is weakest.</p>
            </div>

            <div className="nba-meta">
              <span>Physics</span>
              <span>25 min</span>
              <span>Today</span>
            </div>
          </div>

          <button
            className={`nba-cta ${started ? 'active' : ''}`}
            onClick={() => setStarted(true)}
          >
            {started ? 'Session ready' : 'Start session →'}
          </button>
        </div>
      </section>

      <style>{`
        .nba-page {
          min-height: 100vh;
          margin: 0;
          padding: 12px;
          background:
            radial-gradient(circle at 50% 0%, rgba(37, 99, 235, .16), transparent 38%),
            #07111F;
          color: #F4F8FB;
          font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .nba-shell {
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
        }

        .nba-card {
          position: relative;
          overflow: hidden;
          padding: 22px;
          border: 1px solid #0B7A5A;
          border-radius: 18px;
          background:
            linear-gradient(145deg, rgba(6, 95, 70, .98), rgba(4, 78, 59, .98) 58%, rgba(3, 61, 47, .98));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.09),
            0 18px 44px rgba(0,0,0,.24);
        }

        .nba-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 8%;
          right: 8%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(110,231,183,.72), transparent);
        }

        .nba-kicker {
          margin-bottom: 18px;
          color: #6EE7B7;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .14em;
          line-height: 1;
          text-transform: uppercase;
        }

        .nba-content h1 {
          margin: 0;
          max-width: 560px;
          font-family: var(--font-geist-sans), Inter, sans-serif;
          font-size: clamp(25px, 6vw, 34px);
          font-weight: 650;
          line-height: 1.05;
          letter-spacing: -.035em;
        }

        .nba-content p {
          max-width: 520px;
          margin: 10px 0 0;
          color: rgba(236, 253, 245, .72);
          font-size: 14px;
          line-height: 1.6;
        }

        .nba-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 18px;
        }

        .nba-meta span {
          padding: 6px 9px;
          border: 1px solid rgba(110,231,183,.22);
          border-radius: 8px;
          background: rgba(2, 44, 34, .28);
          color: rgba(236,253,245,.78);
          font-size: 11px;
          line-height: 1;
        }

        .nba-cta {
          width: 100%;
          min-height: 48px;
          margin-top: 22px;
          border: 1px solid #6EE7B7;
          border-radius: 11px;
          background: transparent;
          color: #A7F3D0;
          font: 700 13px var(--font-inter), Inter, sans-serif;
          letter-spacing: .01em;
          cursor: pointer;
          transition: background .16s ease, color .16s ease, transform .16s ease;
        }

        .nba-cta:hover {
          background: #10B981;
          color: #052E24;
        }

        .nba-cta:active {
          transform: translateY(1px);
        }

        .nba-cta:focus-visible {
          outline: 2px solid #A7F3D0;
          outline-offset: 3px;
        }

        .nba-cta.active {
          background: #10B981;
          color: #052E24;
        }

        @media (min-width: 640px) {
          .nba-page {
            padding: 16px;
          }

          .nba-card {
            padding: 26px;
          }

          .nba-cta {
            width: auto;
            min-width: 190px;
            padding-inline: 22px;
          }
        }
      `}</style>
    </main>
  )
}
