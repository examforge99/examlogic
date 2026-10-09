'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { dashboardColors as C, dashboardStyles as css } from './styles'

export type TodaySchedule = {
  planned_seconds: number
  used_seconds: number
  remaining_seconds: number
  subjects: string[]
  day_type: 'practice' | 'rest'
}

type TodayPreparationProps = {
  schedule: TodaySchedule | null
}

export default function TodayPreparation({ schedule }: TodayPreparationProps) {
  const router = useRouter()
  if (!schedule) return null

  return (
    <section style={css.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
        <div>
          <p style={css.label}>Today's preparation</p>
          <h2 style={{ ...css.title, fontSize: 16 }}>{schedule.day_type === 'practice' ? 'On your schedule' : 'A lighter day'}</h2>
        </div>
        <button onClick={() => router.push('/timetable')} aria-label="Open timetable" style={{ color: C.primary, padding: 4 }}>
          <ArrowRight size={17} />
        </button>
      </div>
      {schedule.subjects?.length ? <p style={css.sub}>{schedule.subjects.join(' · ')}</p> : <p style={css.sub}>No subjects scheduled today.</p>}
    </section>
  )
}
