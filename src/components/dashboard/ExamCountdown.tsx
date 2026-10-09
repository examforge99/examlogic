import { dashboardColors as C, dashboardStyles as css } from './styles'

type ExamCountdownProps = {
  daysRemaining: number | null
  ringProgress: number
}

export default function ExamCountdown({ daysRemaining, ringProgress }: ExamCountdownProps) {
  return (
    <section aria-label="Exam countdown" style={{ ...css.panel, background: 'linear-gradient(135deg, #102942, #0D1B2E 72%)', display: 'flex', alignItems: 'center', gap: 18, overflow: 'hidden' }}>
      <div style={{ width: 118, height: 118, flex: '0 0 118px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'conic-gradient(' + C.primary + ' ' + ringProgress + '%, rgba(255,255,255,.09) 0)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', background: '#0D1B2E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <strong style={{ fontSize: daysRemaining === null ? 24 : 31, letterSpacing: '-.05em' }}>{daysRemaining === null ? 'TBA' : daysRemaining}</strong>
          <span style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '.08em' }}>{daysRemaining === null ? 'JAMB date' : 'days to JAMB'}</span>
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={css.label}>Your exam countdown</p>
        <h1 style={{ ...css.title, fontSize: 18 }}>{daysRemaining === null ? 'Build your momentum.' : daysRemaining === 0 ? 'Exam day is here.' : 'Every session counts.'}</h1>
        <p style={css.sub}>{daysRemaining === null ? 'JAMB date has not been announced. Keep preparing.' : 'A little progress today keeps your preparation moving.'}</p>
      </div>
    </section>
  )
}
