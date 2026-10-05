'use client'

import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import TodayMission from '@/components/nba/TodayMission'
import RecentActivity from '@/components/RecentActivity'
import TodaySchedule from '@/components/timetable/TodaySchedule'

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#071426' } as const,
  main: {
    width: '100%',
    maxWidth: 620,
    margin: '0 auto',
    padding: '12px 16px 120px',
    boxSizing: 'border-box',
  } as const,
  missionSection: { width: '100%' } as const,
  supportStack: {
    display: 'grid',
    gap: 28,
    marginTop: 28,
  } as const,
}

export default function DashboardPage() {
  return (
    <div style={styles.page}>
      <TopBar showBack={false} showNotif={true} showAvatar={true} avatarInitial='V' />
      <main style={styles.main}>
        <section style={styles.missionSection} aria-label="Today's focus">
          <TodayMission />
        </section>

        <div style={styles.supportStack}>
          <TodaySchedule />
          <RecentActivity />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
