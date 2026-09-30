'use client'

import { Clock3, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'

export type RecentActivityItem = { id: string; topic: string; subject: string; mode: string; action?: 'Read' | 'Recall' | 'Practice'; duration: string; timestamp: string }
type RecentActivityProps = { activities?: RecentActivityItem[]; onSeeAll?: () => void }
type ActivityState = 'loading' | 'success' | 'empty' | 'error'

export default function RecentActivity({ activities: initialActivities, onSeeAll }: RecentActivityProps) {
  const [activities, setActivities] = useState<RecentActivityItem[]>(initialActivities ?? [])
  const [state, setState] = useState<ActivityState>(initialActivities ? (initialActivities.length ? 'success' : 'empty') : 'loading')

  async function loadActivities() {
    setState('loading')
    try {
      const response = await fetch('/api/recent-activity', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load recent activity')
      const data = (await response.json()) as { activities?: RecentActivityItem[] }
      const next = data.activities ?? []
      setActivities(next)
      setState(next.length ? 'success' : 'empty')
    } catch {
      setState('error')
    }
  }

  useEffect(() => { if (!initialActivities) void loadActivities() }, [initialActivities])

  return (
    <section className='recent-activity' aria-labelledby='recent-activity-title'>
      <div className='recent-activity-header'>
        <div><h2 id='recent-activity-title'>Recent activity</h2><p>Your latest preparation work.</p></div>
        <button type='button' className='recent-activity-see-all' onClick={onSeeAll}>See all</button>
      </div>

      {state === 'loading' && (
        <div className='recent-activity-list' aria-label='Loading recent activity' aria-busy='true'>
          {[1, 2, 3].map((item) => <div key={item} style={{ height: 62, borderBottom: '1px solid rgba(232,240,247,.055)', position: 'relative', padding: '14px 0', boxSizing: 'border-box' }}><div style={{ width: '42%', height: 10, borderRadius: 5, background: 'rgba(232,240,247,.08)' }} /><div style={{ width: '58%', height: 7, marginTop: 8, borderRadius: 5, background: 'rgba(232,240,247,.06)' }} /><div style={{ width: '30%', height: 6, marginTop: 7, borderRadius: 5, background: 'rgba(232,240,247,.05)' }} /><div style={{ position: 'absolute', right: 0, top: 14, width: 42, height: 7, borderRadius: 5, background: 'rgba(232,240,247,.07)' }} /></div>)}
        </div>
      )}

      {state === 'error' && <div className='recent-activity-empty'><h3>Couldn’t load activity</h3><p>Something went wrong while loading your recent preparation work.</p><button type='button' className='recent-activity-retry' onClick={() => void loadActivities()}><RotateCw size={12} /> Try again</button></div>}
      {state === 'empty' && <div className='recent-activity-empty'><h3>No activity yet</h3><p>Complete your first study activity and it will appear here.</p></div>}

      {state === 'success' && <div className='recent-activity-list'>{activities.map((activity, index) => <article className='recent-activity-item' key={activity.id}><div className='recent-activity-main'><h3>{activity.topic}</h3><div className='recent-activity-context'><span>{activity.subject}</span><span aria-hidden='true'>·</span><span>{activity.mode}</span>{activity.action && <><span aria-hidden='true'>·</span><span className='recent-activity-action'>{activity.action}</span></>}</div><p className='recent-activity-time'>{activity.timestamp}</p></div><div className='recent-activity-duration'><Clock3 size={13} strokeWidth={2} /><span>{activity.duration}</span></div>{index < activities.length - 1 && <div className='recent-activity-divider' />}</article>)}</div>}

      <style jsx>{'.recent-activity{width:100%;margin:16px 0 0;padding:21px;box-sizing:border-box;border:1px solid var(--color-border);border-radius:14px;background:var(--color-surface);box-shadow:var(--shadow-card);color:var(--color-text-primary)}.recent-activity-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px}.recent-activity-header h2{margin:0;color:#f1f6fa;font-size:16px;font-weight:700;letter-spacing:-.025em;line-height:1.2}.recent-activity-header p{margin:4px 0 0;color:rgba(232,240,247,.42);font-size:10px;line-height:1.4}.recent-activity-see-all,.recent-activity-retry{border:0;background:transparent;color:var(--color-primary);font:inherit;font-size:10px;font-weight:700;cursor:pointer}.recent-activity-see-all{flex:0 0 auto;padding:4px 0;margin-top:1px}.recent-activity-list{border-top:1px solid rgba(232,240,247,.07)}.recent-activity-item{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;min-width:0;padding:14px 0}.recent-activity-main{min-width:0}.recent-activity-main h3{overflow:hidden;margin:0;color:#dfeaf1;font-size:13px;font-weight:700;letter-spacing:-.012em;line-height:1.35;text-overflow:ellipsis;white-space:nowrap}.recent-activity-context{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:5px;color:rgba(232,240,247,.52);font-size:10px;line-height:1.4}.recent-activity-action{color:#9edaff;font-weight:700}.recent-activity-time{margin:4px 0 0;color:rgba(232,240,247,.34);font-size:9px;line-height:1.4}.recent-activity-duration{display:inline-flex;flex:0 0 auto;align-items:center;gap:5px;padding-top:1px;color:rgba(232,240,247,.58);font-size:10px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}.recent-activity-duration svg{color:var(--color-accent)}.recent-activity-divider{position:absolute;right:0;bottom:0;left:0;height:1px;background:rgba(232,240,247,.055)}.recent-activity-empty{padding:22px 4px 6px;border-top:1px solid rgba(232,240,247,.07)}.recent-activity-empty h3{margin:0;color:#dfeaf1;font-size:13px;font-weight:700}.recent-activity-empty p{max-width:280px;margin:5px 0 0;color:rgba(232,240,247,.46);font-size:10px;line-height:1.5}.recent-activity-retry{display:inline-flex;align-items:center;gap:5px;margin-top:10px;padding:0}button:focus-visible{outline:2px solid var(--color-primary);outline-offset:3px}'}</style>
    </section>
  )
}