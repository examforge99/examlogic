'use client'

import { Sparkles } from 'lucide-react'
import TodayMission, { type Mission } from '@/components/nba/TodayMission'
import { dashboardStyles as css } from './styles'

type NextMoveSectionProps = {
  missions?: Mission[]
  error: boolean
  onRefresh: () => Promise<void>
}

export default function NextMoveSection({ missions, error, onRefresh }: NextMoveSectionProps) {
  return (
    <section aria-label="Next best action" style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <p style={css.label}>Next move</p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#087A5D', fontSize: 10, fontWeight: 750 }}>
          <Sparkles size={12} /> PERSONALIZED
        </span>
      </div>
      <TodayMission
        initialMissions={missions}
        deferFetch
        initialError={error ? 'Your next recommendation is temporarily unavailable. Try again shortly.' : null}
        onDashboardRefresh={onRefresh}
      />
    </section>
  )
}
