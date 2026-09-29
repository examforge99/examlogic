'use client'

import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import TodayMission from '@/components/nba/TodayMission'
import RecentActivity from '@/components/RecentActivity'

export default function DashboardPage() {
  return (
    <div style={{ backgroundColor: '#071426' }} className="min-h-screen">
      <TopBar showBack={false} showNotif={true} showAvatar={true} avatarInitial="V" />

      <main className="px-4 pt-2" style={{ marginBottom: '120px' }}>
        <TodayMission />
        <RecentActivity />
      </main>

      <BottomNav />
    </div>
  )
}
