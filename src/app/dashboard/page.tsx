'use client'

import Navbar from '@/components/Navbar'
import ScoreDistribution from '@/components/ScoreDistribution'
import PracticeModes from '@/components/PracticeModes'
import RecentTests from '@/components/RecentTests'
import LeaderboardPreview from '@/components/LeaderboardPreview'
import { useDashboard } from '@/hooks/useDashboard'

export default function DashboardPage() {
  const { data, loading, error } = useDashboard()

  return (
    <div style={{ minHeight: '100vh', background: '#071426' }}>
      <Navbar />

      <main style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#F97316', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <ScoreDistribution
          subjects={loading ? undefined : (data?.subjects ?? [])}
        />

        <PracticeModes />

        <RecentTests
          tests={loading ? undefined : (data?.tests ?? [])}
        />

        <LeaderboardPreview />

      </main>
    </div>
  )
}
