// app/analytics/page.tsx
'use client'

import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import StatCard from '@/components/analytics/StatCard'
import AccuracyTrendChart from '@/components/analytics/AccuracyTrendChart'
import DifficultyPerformanceCard from '@/components/analytics/DifficultyPerformanceCard'
import HeatMap from '@/components/analytics/HeatMap'
import PracticeModeCard from '@/components/analytics/PracticeModeCard'

export default function AnalyticsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#071426' }}>
      <TopBar title="Analytics" subtitle="Track your progress" showBack={false} showNotif={true} showAvatar={true} avatarInitial="V" />
      <main style={{ width: '100%', maxWidth: 620, margin: '0 auto', padding: '18px 16px 120px', boxSizing: 'border-box' }}>
        <section aria-labelledby="analytics-heading" style={{ marginBottom: 24 }}>
          <h1 id="analytics-heading" style={{ margin: 0, color: '#E8F0F7', fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-.035em' }}>Your learning performance</h1>
          <p style={{ margin: '5px 0 0', color: 'rgba(232,240,247,.48)', fontFamily: 'Inter,sans-serif', fontSize: 12, lineHeight: 1.5 }}>See what is improving, where you are struggling, and how you have been preparing.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 18 }}>
            <StatCard value="1,248" label="Questions" valueColor="#3FB7FF" iconBg="transparent" icon={<span style={{ color: '#3FB7FF' }}>↗</span>} className="analytics-stat" />
            <StatCard value="43" suffix="h" label="Study time" valueColor="#A78BFA" iconBg="transparent" icon={<span style={{ color: '#A78BFA' }}>◷</span>} className="analytics-stat" />
            <StatCard value="12" suffix="d" label="Current streak" valueColor="#FF8C55" iconBg="transparent" icon={<span style={{ color: '#FF8C55' }}>↗</span>} className="analytics-stat" />
          </div>
        </section>
        <AccuracyTrendChart />
        <div style={{ display: 'grid', gap: 30, marginTop: 30 }}>
          <HeatMap />
          <DifficultyPerformanceCard />
          <PracticeModeCard />
        </div>
      </main>
      <BottomNav />
      <style>{'.analytics-stat>div:first-child{display:none!important}.analytics-stat{min-width:0}.analytics-stat span{white-space:normal}'}</style>
    </div>
  )
}
