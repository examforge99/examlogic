'use client'

import { Clock3 } from 'lucide-react'

export type RecentActivityItem = {
  id: string
  topic: string
  subject: string
  mode: string
  action?: 'Read' | 'Recall' | 'Practice'
  duration: string
  timestamp: string
}

type RecentActivityProps = {
  activities?: RecentActivityItem[]
  onSeeAll?: () => void
}

const mockActivities: RecentActivityItem[] = [
  { id: 'motion-read', topic: 'Motion', subject: 'Physics', mode: "Today's Mission", action: 'Read', duration: '18 min', timestamp: 'Today, 2:32 PM' },
  { id: 'equilibrium-recall', topic: 'Chemical Equilibrium', subject: 'Chemistry', mode: "Today's Mission", action: 'Recall', duration: '12 min', timestamp: 'Today, 1:18 PM' },
  { id: 'projectile-motion', topic: 'Projectile Motion', subject: 'Physics', mode: 'Campaign', duration: '24 min', timestamp: 'Yesterday, 6:41 PM' },
  { id: 'algebra-quick-fire', topic: 'Algebra', subject: 'Mathematics', mode: 'Quick Fire', duration: '8 min', timestamp: 'Sep 27, 11:42 AM' },
]

export default function RecentActivity({ activities = mockActivities, onSeeAll }: RecentActivityProps) {
  return (
    <section className='recent-activity' aria-labelledby='recent-activity-title'>
      <div className='recent-activity-header'>
        <div>
          <h2 id='recent-activity-title'>Recent activity</h2>
          <p>Your latest preparation work.</p>
        </div>
        <button type='button' className='recent-activity-see-all' onClick={onSeeAll}>See all</button>
      </div>

      {activities.length === 0 ? (
        <div className='recent-activity-empty'>
          <h3>No activity yet</h3>
          <p>Complete your first study activity and it will appear here.</p>
        </div>
      ) : (
        <div className='recent-activity-list'>
          {activities.map((activity, index) => (
            <article className='recent-activity-item' key={activity.id}>
              <div className='recent-activity-main'>
                <h3>{activity.topic}</h3>
                <div className='recent-activity-context'>
                  <span>{activity.subject}</span>
                  <span aria-hidden='true'>·</span>
                  <span>{activity.mode}</span>
                  {activity.action && (
                    <>
                      <span aria-hidden='true'>·</span>
                      <span className='recent-activity-action'>{activity.action}</span>
                    </>
                  )}
                </div>
                <p className='recent-activity-time'>{activity.timestamp}</p>
              </div>

              <div className='recent-activity-duration'>
                <Clock3 size={13} strokeWidth={2} aria-hidden='true' />
                <span>{activity.duration}</span>
              </div>

              {index < activities.length - 1 && <div className='recent-activity-divider' aria-hidden='true' />}
            </article>
          ))}
        </div>
      )}

      <style jsx>{'.recent-activity{width:100%;margin-top:16px;padding:18px;box-sizing:border-box;border:1px solid var(--color-border);border-radius:14px;background:var(--color-surface);box-shadow:var(--shadow-card);color:var(--color-text-primary)}.recent-activity-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}.recent-activity-header h2{margin:0;color:#f1f6fa;font-size:16px;font-weight:700;letter-spacing:-.025em;line-height:1.2}.recent-activity-header p{margin:4px 0 0;color:rgba(232,240,247,.42);font-size:10px;line-height:1.4}.recent-activity-see-all{flex:0 0 auto;margin-top:1px;padding:4px 0;border:0;background:transparent;color:var(--color-primary);font:inherit;font-size:10px;font-weight:700;cursor:pointer}.recent-activity-list{border-top:1px solid rgba(232,240,247,.07)}.recent-activity-item{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;min-width:0;padding:14px 0}.recent-activity-main{min-width:0}.recent-activity-main h3{overflow:hidden;margin:0;color:#dfeaf1;font-size:13px;font-weight:700;letter-spacing:-.012em;line-height:1.35;text-overflow:ellipsis;white-space:nowrap}.recent-activity-context{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:5px;color:rgba(232,240,247,.52);font-size:10px;line-height:1.4}.recent-activity-action{color:#9edaff;font-weight:700}.recent-activity-time{margin:4px 0 0;color:rgba(232,240,247,.34);font-size:9px;line-height:1.4}.recent-activity-duration{display:inline-flex;flex:0 0 auto;align-items:center;gap:5px;padding-top:1px;color:rgba(232,240,247,.58);font-size:10px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}.recent-activity-duration svg{color:var(--color-accent)}.recent-activity-divider{position:absolute;right:0;bottom:0;left:0;height:1px;background:rgba(232,240,247,.055)}.recent-activity-empty{padding:22px 4px 6px;border-top:1px solid rgba(232,240,247,.07)}.recent-activity-empty h3{margin:0;color:#dfeaf1;font-size:13px;font-weight:700}.recent-activity-empty p{max-width:280px;margin:5px 0 0;color:rgba(232,240,247,.46);font-size:10px;line-height:1.5}button:focus-visible{outline:2px solid var(--color-primary);outline-offset:3px}'}</style>
    </section>
  )
}
