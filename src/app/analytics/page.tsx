// app/analytics/page.tsx
'use client'

import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import StatCard from '@/components/ui/StatCard'
import AccuracyTrendChart from '@/components/analytics/AccuracyTrendChart'
import DifficultyPerformanceCard from '@/components/analytics/DifficultyPerformanceCard'
import HeatMap from '@/components/analytics/HeatMap'
import PracticeModeCard from '@/components/analytics/PracticeModeCard'

export default function AnalyticsPage() {
  return (
    <div
      style={{ backgroundColor: '#071426' }}
      className="min-h-screen"
    >
      <TopBar
        title="Analytics"
        subtitle="Track your progress"
        showBack={false}
        showNotif={true}
        showAvatar={true}
        avatarInitial="V"
      />

      <main className="w-full px-0 pt-3 pb-28 flex flex-col gap-3">

        {/* Stat row */}
        <div className="px-0 grid grid-cols-4 gap-2">
          <StatCard
            value="1,248"
            label="Total Qs"
            valueColor="#3FB7FF"
            iconBg="#3FB7FF15"
            icon={
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#3FB7FF"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />

          <StatCard
            value="75"
            suffix="%"
            label="Avg Accuracy"
            valueColor="#25d6a2"
            iconBg="#25d6a215"
            icon={
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#25d6a2"
                strokeWidth={2}
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />

          <StatCard
            value="12"
            suffix="d"
            label="Streak"
            valueColor="#ff8c55"
            iconBg="#ff8c5515"
            icon={
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff8c55"
                strokeWidth={2}
              >
                <path d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z" />
              </svg>
            }
          />

          <StatCard
            value="43"
            suffix="h"
            label="Study Time"
            valueColor="#a78bfa"
            iconBg="#a78bfa15"
            icon={
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a78bfa"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
        </div>

        {/* Analytics cards */}
        <AccuracyTrendChart />

        <HeatMap />

        <DifficultyPerformanceCard />

        <PracticeModeCard />

      </main>

      <BottomNav />
    </div>
  )
}
