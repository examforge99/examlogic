// src/app/prototypes/recent-activity/page.tsx
'use client'

import { Inter } from 'next/font/google'
import { Clock3 } from 'lucide-react'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

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
          padding: 24px 14px 50px;
          background: radial-gradient(circle at 50% 0%, rgba(63,183,255,.12), transparent 34%), #071426;
          color: var(--color-text-primary);
          -webkit-font-smoothing: antialiased;
        }

        .prototype-shell { width: min(100%, 620px); margin: 0 auto; padding-top: 5vh; }

        .activity-card {
          position: relative;
          overflow: hidden;
          padding: 21px;
          border: 1px solid var(--color-border);
          border-radius: 14px;
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
          gap: 16px;
          margin-bottom: 18px;
        }

        h1 { margin: 0; color: #F1F6FA; font-size: 20px; font-weight: 700; letter-spacing: -.035em; }

        .see-all {
          border: 0;
          padding: 4px 0;
          background: transparent;
          color: var(--color-primary);
          font: inherit;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .activity-list { position: relative; z-index: 1; border-top: 1px solid rgba(232,240,247,.07); }
        .activity-row { position: relative; display: flex; padding: 16px 0; }
        .activity-content { min-width: 0; width: 100%; }

        .activity-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .activity-identity {
          display: flex;
          min-width: 0;
          align-items: center;
          flex-wrap: wrap;
          gap: 7px;
        }

        .mode { color: #F0F5F9; font-size: 12px; font-weight: 700; letter-spacing: -.012em; }

        .action-tag {
          padding: 4px 7px;
          border: 1px solid rgba(63,183,255,.18);
          border-radius: 6px;
          background: rgba(63,183,255,.07);
          color: #9EDAFF;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
        }

        .duration {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 5px;
          color: rgba(232,240,247,.62);
          font-size: 11px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
        }

        .duration svg { color: var(--color-accent); }

        .activity-main {
          display: flex;
          min-width: 0;
          align-items: baseline;
          gap: 5px;
          margin-top: 7px;
          color: rgba(232,240,247,.62);
          font-size: 11px;
          line-height: 1.45;
        }

        .subject { color: #AFC5D6; font-weight: 600; }
        .separator { color: rgba(232,240,247,.23); }

        .topic {
          overflow: hidden;
          color: #D9E5ED;
          font-weight: 600;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .timestamp { margin: 4px 0 0; color: rgba(232,240,247,.34); font-size: 10px; line-height: 1.4; }

        .row-divider {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 1px;
          background: rgba(232,240,247,.055);
        }

        .activity-row:last-child .row-divider { display: none; }
        button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 3px; }

        @media (max-width: 520px) {
          .recent-activity-prototype { padding: 18px 12px 40px; }
          .prototype-shell { padding-top: 2vh; }
          .activity-card { padding: 18px; border-radius: 14px; }
          .activity-row { padding: 15px 0; }
          .duration { margin-top: 1px; }
        }
      `}</style>
    </main>
  )
}
