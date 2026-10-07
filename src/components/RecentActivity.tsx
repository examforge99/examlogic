'use client'

import { Clock3, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'

export type RecentActivityItem = {
  id: string
  topic: string
  subject: string
  mode: string
  action?: 'Read' | 'Recall' | 'Practice'
  duration: string
  timestamp: string
}

type Props = {
  activities?: RecentActivityItem[]
  onSeeAll?: () => void
  deferFetch?: boolean
  initialError?: boolean
}

type State = 'loading' | 'success' | 'empty' | 'error'

export default function RecentActivity({ activities: initialActivities, onSeeAll, deferFetch = false, initialError = false }: Props) {
  const [activities, setActivities] = useState<RecentActivityItem[]>(initialActivities ?? [])
  const [state, setState] = useState<State>(initialError ? 'error' : initialActivities ? (initialActivities.length ? 'success' : 'empty') : 'loading')

  async function loadActivities() {
    setState('loading')
    try {
      const response = await fetch('/api/recent-activity', { cache: 'no-store' })
      if (!response.ok) throw new Error('load')
      const data = (await response.json()) as { activities?: RecentActivityItem[] }
      const next = data.activities ?? []
      setActivities(next)
      setState(next.length ? 'success' : 'empty')
    } catch {
      setState('error')
    }
  }

  useEffect(() => {
    if (initialError) {
      setState('error')
      return
    }
    if (initialActivities) {
      setActivities(initialActivities)
      setState(initialActivities.length ? 'success' : 'empty')
      return
    }
    if (!deferFetch) void loadActivities()
  }, [initialActivities, deferFetch, initialError])

  return (
    <section className="recent-activity" aria-labelledby="recent-activity-title">
      <div className="recent-activity-header">
        <div>
          <p className="dashboard-eyebrow">History</p>
          <h2 id="recent-activity-title">Recent activity</h2>
        </div>
        <button className="recent-activity-see-all" type="button" onClick={onSeeAll}>See all</button>
      </div>

      {state === 'loading' ? (
        <div className="recent-activity-list" aria-busy="true" aria-label="Loading recent activity">
          {[1, 2, 3].map(item => (
            <div className="recent-activity-skeleton" key={item}>
              <span /><span /><span />
            </div>
          ))}
        </div>
      ) : null}

      {state === 'error' ? (
        <div className="recent-activity-message">
          <h3>Couldn’t load activity</h3>
          <p>Something went wrong while loading your preparation history.</p>
          <button className="recent-activity-retry" type="button" onClick={() => void loadActivities()}>
            <RotateCw size={12} /> Try again
          </button>
        </div>
      ) : null}

      {state === 'empty' ? (
        <div className="recent-activity-message">
          <h3>No activity yet</h3>
          <p>Complete your first study activity and it will appear here.</p>
        </div>
      ) : null}

      {state === 'success' ? (
        <div className="recent-activity-list">
          {activities.map((activity, index) => (
            <article className="recent-activity-item" key={activity.id}>
              <div className="recent-activity-main">
                <h3>{activity.topic}</h3>
                <div className="recent-activity-context">
                  <span>{activity.subject}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activity.mode}</span>
                  {activity.action ? <><span aria-hidden="true">·</span><span>{activity.action}</span></> : null}
                </div>
                <p className="recent-activity-time">{activity.timestamp}</p>
              </div>
              <div className="recent-activity-duration">
                <Clock3 size={13} />
                <span>{activity.duration}</span>
              </div>
              {index < activities.length - 1 ? <div className="recent-activity-divider" /> : null}
            </article>
          ))}
        </div>
      ) : null}

      <style>{`
        .recent-activity{width:100%;box-sizing:border-box;padding:16px;border:1px solid var(--color-border);border-radius:14px;background:var(--color-surface);color:var(--color-text-primary)}
        .recent-activity-header{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:12px}
        .dashboard-eyebrow{margin:0 0 3px;color:var(--color-primary);font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .recent-activity-header h2{margin:0;font-family:var(--font-display);font-size:17px;line-height:1.2;font-weight:700;letter-spacing:-.02em}
        .recent-activity-see-all,.recent-activity-retry{display:inline-flex;align-items:center;gap:5px;padding:0;border:0;background:transparent;color:var(--color-primary);font:inherit;font-size:10px;font-weight:800}
        .recent-activity-list{border-top:1px solid var(--color-border)}
        .recent-activity-item{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;min-width:0;padding:13px 0}
        .recent-activity-main{min-width:0}
        .recent-activity-main h3{overflow:hidden;margin:0;color:var(--color-text-primary);font-size:13px;font-weight:700;line-height:1.35;text-overflow:ellipsis;white-space:nowrap}
        .recent-activity-context{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:4px;color:var(--color-text-secondary);font-size:10px;line-height:1.4}
        .recent-activity-time{margin:4px 0 0;color:var(--color-text-muted);font-size:9px}
        .recent-activity-duration{display:inline-flex;flex:0 0 auto;align-items:center;gap:5px;color:var(--color-text-secondary);font-size:10px;font-weight:700;white-space:nowrap}
        .recent-activity-duration svg{color:var(--color-accent)}
        .recent-activity-divider{position:absolute;right:0;bottom:0;left:0;height:1px;background:var(--color-border)}
        .recent-activity-message{padding:16px 0 2px;border-top:1px solid var(--color-border)}
        .recent-activity-message h3{margin:0;font-size:13px;font-weight:700}
        .recent-activity-message p{max-width:300px;margin:5px 0 0;color:var(--color-text-muted);font-size:10px;line-height:1.5}
        .recent-activity-retry{margin-top:10px}
        .recent-activity-skeleton{padding:13px 0;border-bottom:1px solid var(--color-border)}
        .recent-activity-skeleton span{display:block;height:7px;margin-bottom:7px;border-radius:5px;background:rgba(115,123,131,.12)}
        .recent-activity-skeleton span:first-child{width:44%;height:10px;background:rgba(115,123,131,.16)}
        .recent-activity-skeleton span:nth-child(2){width:64%}
        .recent-activity-skeleton span:last-child{width:28%;margin-bottom:0}
        @media (prefers-reduced-motion:reduce){.recent-activity-skeleton span{animation:none}}
      `}</style>
    </section>
  )
}
