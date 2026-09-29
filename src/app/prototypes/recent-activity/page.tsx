// src/app/prototypes/recent-activity/page.tsx
'use client'

import {
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Target,
  Zap,
} from 'lucide-react'

type Activity = {
  mode: string
  action?: string
  subject: string
  topic: string
  duration: string
  timestamp: string
  studyPlan?: boolean
  icon: 'mission' | 'campaign' | 'quickfire'
}

const activities: Activity[] = [
  {
    mode: "Today's Mission",
    action: 'Read',
    subject: 'Physics',
    topic: 'Motion',
    duration: '18 min',
    timestamp: 'Today, 2:32 PM',
    studyPlan: true,
    icon: 'mission',
  },
  {
    mode: "Today's Mission",
    action: 'Recall',
    subject: 'Chemistry',
    topic: 'Chemical Equilibrium',
    duration: '12 min',
    timestamp: 'Today, 1:18 PM',
    studyPlan: true,
    icon: 'mission',
  },
  {
    mode: 'Campaign',
    subject: 'Physics',
    topic: 'Projectile Motion',
    duration: '24 min',
    timestamp: 'Yesterday, 6:41 PM',
    icon: 'campaign',
  },
  {
    mode: 'Quick Fire',
    subject: 'Mathematics',
    topic: 'Algebra',
    duration: '8 min',
    timestamp: 'Sep 27, 11:42 AM',
    icon: 'quickfire',
  },
]

function ActivityIcon({ type }: { type: Activity['icon'] }) {
  if (type === 'mission') return <Target size={15} strokeWidth={2.2} />
  if (type === 'campaign') return <BookOpen size={15} strokeWidth={2.2} />
  return <Zap size={15} strokeWidth={2.2} />
}

const styles = `
  .activity-page {
    min-height: 100vh;
    padding: 28px 16px 60px;
    background:
      radial-gradient(circle at 50% -8%, rgba(63,183,255,.13), transparent 32%),
      radial-gradient(circle at 85% 42%, rgba(37,214,162,.055), transparent 28%),
      #071426;
    color: #E8F0F7;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .prototype-shell {
    width: min(100%, 780px);
    margin: 0 auto;
    padding-top: 9vh;
  }

  .activity-card {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(92,125,170,.32);
    border-radius: 24px;
    background: linear-gradient(145deg, rgba(13,27,46,.98), rgba(11,29,50,.98) 62%, rgba(12,34,48,.98));
    box-shadow: 0 28px 75px rgba(0,0,0,.30), inset 0 1px 0 rgba(255,255,255,.055);
  }

  .activity-card::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    background: linear-gradient(125deg, rgba(63,183,255,.035), transparent 42%, rgba(37,214,162,.035));
  }

  .card-header,
  .activity-list,
  .prototype-note {
    position: relative;
    z-index: 1;
  }

  .card-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 22px 18px;
  }

  .eyebrow {
    margin: 0 0 5px;
    color: rgba(232,240,247,.36);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .12em;
  }

  h1 {
    margin: 0;
    color: #F1F6FA;
    font-size: 21px;
    font-weight: 720;
    letter-spacing: -.035em;
  }

  .see-all {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 7px 0;
    border: 0;
    background: transparent;
    color: #75C8FF;
    font: 650 11px Inter, ui-sans-serif, system-ui, sans-serif;
    cursor: pointer;
  }

  .activity-list {
    border-top: 1px solid rgba(232,240,247,.065);
  }

  .activity-row {
    position: relative;
    display: flex;
    gap: 12px;
    padding: 17px 22px;
  }

  .activity-check {
    flex: 0 0 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 25px;
    height: 25px;
    margin-top: 1px;
    border: 1px solid rgba(37,214,162,.28);
    border-radius: 8px;
    background: rgba(37,214,162,.08);
    color: #54DDB7;
  }

  .activity-content {
    min-width: 0;
    flex: 1;
  }

  .activity-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .mode-line {
    display: flex;
    min-width: 0;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
  }

  .mode-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 23px;
    height: 23px;
    border-radius: 7px;
    background: rgba(63,183,255,.08);
    color: #72C8FF;
  }

  .mode {
    color: #F0F5F9;
    font-size: 12px;
    font-weight: 720;
    letter-spacing: -.012em;
  }

  .study-tag {
    padding: 4px 7px;
    border: 1px solid rgba(37,214,162,.17);
    border-radius: 6px;
    background: rgba(37,214,162,.065);
    color: #67DDBD;
    font-size: 9px;
    font-weight: 750;
    line-height: 1;
  }

  .duration {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 5px;
    color: rgba(232,240,247,.64);
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .duration svg {
    color: #4FCBA9;
  }

  .activity-main {
    display: flex;
    min-width: 0;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 7px;
    color: rgba(232,240,247,.58);
    font-size: 11px;
    line-height: 1.45;
  }

  .activity-main .action {
    color: #A9DFFF;
    font-weight: 650;
  }

  .activity-main .topic {
    overflow: hidden;
    color: #D9E5ED;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .separator {
    color: rgba(232,240,247,.24);
  }

  .timestamp {
    margin: 5px 0 0;
    color: rgba(232,240,247,.35);
    font-size: 10px;
    line-height: 1.4;
  }

  .row-divider {
    position: absolute;
    right: 22px;
    bottom: 0;
    left: 59px;
    height: 1px;
    background: rgba(232,240,247,.055);
  }

  .prototype-note {
    margin-top: 14px;
    color: rgba(232,240,247,.22);
    font-size: 9px;
    text-align: center;
  }

  button:focus-visible {
    outline: 2px solid #3FB7FF;
    outline-offset: 3px;
  }

  @media (max-width: 520px) {
    .prototype-shell { padding-top: 3vh; }
    .activity-card { border-radius: 21px; }
    .card-header { padding: 19px 17px 16px; }
    .activity-row { gap: 10px; padding: 16px 17px; }
    .row-divider { right: 17px; left: 52px; }
    .activity-topline { align-items: flex-start; }
    .duration { margin-top: 2px; }
  }
`

export default function RecentActivityPrototype() {
  return (
    <main className="activity-page">
      <section className="prototype-shell">
        <article className="activity-card" aria-label="Recent activity">
          <header className="card-header">
            <div>
              <p className="eyebrow">YOUR LEARNING TRAIL</p>
              <h1>Recent activity</h1>
            </div>

            <button className="see-all" type="button">
              See all
              <ChevronRight size={15} strokeWidth={2.2} />
            </button>
          </header>

          <div className="activity-list">
            {activities.map((activity, index) => (
              <div className="activity-row" key={`${activity.mode}-${activity.topic}`}>
                <div className="activity-check" aria-hidden="true">
                  <Check size={13} strokeWidth={2.8} />
                </div>

                <div className="activity-content">
                  <div className="activity-topline">
                    <div className="mode-line">
                      <span className="mode-icon" aria-hidden="true">
                        <ActivityIcon type={activity.icon} />
                      </span>
                      <span className="mode">{activity.mode}</span>

                      {activity.studyPlan && (
                        <span className="study-tag">Study Plan</span>
                      )}
                    </div>

                    <span className="duration">
                      <Clock3 size={13} strokeWidth={2.2} />
                      {activity.duration}
                    </span>
                  </div>

                  <div className="activity-main">
                    {activity.action && (
                      <>
                        <span className="action">{activity.action}</span>
                        <span className="separator">·</span>
                      </>
                    )}
                    <span>{activity.subject}</span>
                    <span className="separator">·</span>
                    <span className="topic">{activity.topic}</span>
                  </div>

                  <p className="timestamp">{activity.timestamp}</p>
                </div>

                {index < activities.length - 1 && (
                  <div className="row-divider" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </article>

        <div className="prototype-note">Prototype · Recent Activity</div>
      </section>

      <style>{styles}</style>
    </main>
  )
}
