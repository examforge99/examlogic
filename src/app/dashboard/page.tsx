'use client'

import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import TodayMission from '@/components/nba/TodayMission'
import RecentActivity from '@/components/RecentActivity'

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#071426' } as const,
  main: { padding: '8px 16px 120px' } as const,
}

export default function DashboardPage() {
  return (
    <div style={styles.page}>
      <TopBar showBack={false} showNotif={true} showAvatar={true} avatarInitial='V' />
      <main style={styles.main}>
        <TodayMission />
        <RecentActivity />
      </main>
      <BottomNav />
    </div>
  )
}
