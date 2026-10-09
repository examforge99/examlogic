import { CalendarClock, Flame } from 'lucide-react'
import { dashboardColors as C, dashboardStyles as css, formatDuration } from './styles'

type StudyTimeStatsProps = {
  usedSeconds: number
  plannedSeconds: number
}

export default function StudyTimeStats({ usedSeconds, plannedSeconds }: StudyTimeStatsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
      <section style={{ ...css.panel, padding: 14, background: '#F0F0EC' }}>
        <div style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 9, background: 'rgba(63,183,255,.16)', color: '#0876B8' }}>
          <CalendarClock size={16} />
        </div>
        <p style={{ ...css.label, marginTop: 15, letterSpacing: '.03em' }}>Yesterday's study time</p>
        <p style={{ fontSize: 25, fontWeight: 780, letterSpacing: '-.04em', marginTop: 5 }}>--</p>
        <p style={{ ...css.sub, marginTop: 3 }}>Time spent learning</p>
      </section>
      <section style={{ ...css.panel, padding: 14, background: '#E7F3ED' }}>
        <div style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 9, background: 'rgba(37,214,162,.18)', color: '#087A5D' }}>
          <Flame size={16} />
        </div>
        <p style={{ ...css.label, marginTop: 15, letterSpacing: '.03em' }}>Today's time used</p>
        <p style={{ fontSize: 25, fontWeight: 780, letterSpacing: '-.04em', marginTop: 5 }}>{plannedSeconds ? formatDuration(usedSeconds) + ' / ' + formatDuration(plannedSeconds) : '--'}</p>
        <p style={{ ...css.sub, marginTop: 3 }}>{plannedSeconds ? formatDuration(Math.max(0, plannedSeconds - usedSeconds)) + ' remaining' : 'Your daily commitment'}</p>
      </section>
    </div>
  )
}
