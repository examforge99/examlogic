// src/app/prototypes/recent-activity/page.tsx
'use client'

import { Inter } from 'next/font/google'
import { Clock3 } from 'lucide-react'

const inter = Inter({
  subsets: ['latin'],
})

type Activity = {
  mode: string
  action?: 'Read' | 'Recall' | 'Practice'
  subject: string
  topic: string
  duration: string
  timestamp: string
}

const activities: Activity[] = [
  { mode: "Today's Mission", action: 'Read', subject: 'Physics', topic: 'Motion', duration: '18 min', timestamp: 'Today, 2:32 PM' },
  { mode: "Today's Mission", action: 'Recall', subject: 'Chemistry', topic: 'Chemical Equilibrium', duration: '12 min', timestamp: 'Today, 1:18 PM' },
  { mode: 'Campaign', subject: 'Physics', topic: 'Projectile Motion', duration: '24 min', timestamp: 'Yesterday, 6:41 PM' },
  { mode: 'Quick Fire', subject: 'Mathematics', topic: 'Algebra', duration: '8 min', timestamp: 'Sep 27, 11:42 AM' },
]

export default function RecentActivityPrototype() {
  return (
    <main className={`recent-activity-prototype ${inter.className}`}>
      <div className="prototype-shell">
        <article className="activity-card" aria-label="Recent activity">
          <header className="card-header">
            <h1>Recent activity</h1>
            <button className="see-all" type="button">See all</button>
          </header>

          <div className="activity-list">
            {activities.map((activity, index) => (
              <div className="activity-row" key={`${activity.mode}-${activity.topic}`}>
                <div className="activity-content">
                  <div className="activity-topline">
                    <div className="activity-identity">
                      <span className="mode">{activity.mode}</span>
                      {activity.action && <span className="action-tag">{activity.action}</span>}
                    </div>

                    <span className="duration">
                      <Clock3 size={13} strokeWidth={2} />
                      {activity.duration}
                    </span>
                  </div>

                  <div className="activity-main">
                    <span className="subject">{activity.subject}</span>
                    <span className="separator">·</span>
                    <span className="topic">{activity.topic}</span>
                  </div>

                  <p className="timestamp">{activity.timestamp}</p>
                </div>

                {index < activities.length - 1 && <div className="row-divider" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </article>
      </div>

      <style>{`
        .recent-activity-prototype {
          min-height: 100vh;
          margin: 0;
          padding: clamp(18px, 4vw, 32px) clamp(12px, 3vw, 24px) clamp(40px, 6vw, 64px);
          background: radial-gradient(circle at 50% 0%, rgba(63,183,255,.12), transparent 34%), #071426;
          color: var(--color-text-primary);
          -webkit-font-smoothing: antialiased;
        }

        .prototype-shell {
          width: 100%;
          max-width: 620px;
          margin-inline: auto;
          padding-top: clamp(16px, 5vh, 48px);
        }

        .activity-card {
          position: relative;
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
          padding: clamp(18px, 3.5vw, 24px);
          border: 1px solid var(--color-border);
          border-radius: clamp(12px, 2vw, 16px);
          background: var(--color-surface);
          box-shadow: var(--shadow-card);
        }

        .activity-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(63,183,255,.28), transparent);
        }

        .card-header {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: clamp(10px, 3vw, 16px);
          margin-bottom: clamp(14px, 3vw, 20px);
        }

        h1 {
          margin: 0;
          color: #F1F6FA;
          font-size: clamp(18px, 3vw, 21px);
          font-weight: 700;
          letter-spacing: -.035em;
        }

        .see-all {
          border: 0;
          padding: 4px 0;
          background: transparent;
          color: var(--color-primary);
          font: inherit;
          font-size: clamp(10px, 2vw, 11px);
          font-weight: 600;
          cursor: pointer;
        }

        .activity-list {
          position: relative;
          z-index: 1;
          border-top: 1px solid rgba(232,240,247,.07);
        }

        .activity-row {
          position: relative;
          display: flex;
          padding-block: clamp(13px, 2.5vw, 17px);
        }

        .activity-content {
          min-width: 0;
          width: 100%;
        }

        .activity-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: clamp(8px, 2.5vw, 14px);
        }

        .activity-identity {
          display: flex;
          min-width: 0;
          align-items: center;
          flex-wrap: wrap;
          gap: clamp(5px, 1.5vw, 8px);
        }

        .mode {
          min-width: 0;
          color: #F0F5F9;
          font-size: clamp(11px, 2.2vw, 12px);
          font-weight: 700;
          letter-spacing: -.012em;
        }

        .action-tag {
          padding: clamp(3px, 1vw, 4px) clamp(6px, 1.5vw, 7px);
          border: 1px solid rgba(63,183,255,.18);
          border-radius: 6px;
          background: rgba(63,183,255,.07);
          color: #9EDAFF;
          font-size: clamp(8px, 1.8vw, 9px);
          font-weight: 700;
          line-height: 1;
        }

        .duration {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 5px;
          color: rgba(232,240,247,.62);
          font-size: clamp(10px, 2vw, 11px);
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .duration svg {
          color: var(--color-accent);
          width: clamp(12px, 2.5vw, 13px);
          height: clamp(12px, 2.5vw, 13px);
        }

        .activity-main {
          display: flex;
          min-width: 0;
          align-items: baseline;
          gap: 5px;
          margin-top: clamp(5px, 1.5vw, 7px);
          color: rgba(232,240,247,.62);
          font-size: clamp(10px, 2vw, 11px);
          line-height: 1.45;
        }

        .subject {
          flex: 0 0 auto;
          color: #AFC5D6;
          font-weight: 600;
        }

        .separator {
          flex: 0 0 auto;
          color: rgba(232,240,247,.23);
        }

        .topic {
          min-width: 0;
          overflow: hidden;
          color: #D9E5ED;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .timestamp {
          margin: 4px 0 0;
          color: rgba(232,240,247,.34);
          font-size: clamp(9px, 1.8vw, 10px);
          line-height: 1.4;
        }

        .row-divider {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 1px;
          background: rgba(232,240,247,.055);
        }

        .activity-row:last-child .row-divider {
          display: none;
        }

        button:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 3px;
        }
      `}</style>
    </main>
  )
}
