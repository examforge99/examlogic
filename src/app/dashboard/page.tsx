// app/(dashboard)/dashboard/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import EmptyState from '@/components/ui/EmptyState'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <div style={{ backgroundColor: '#071426' }} className="min-h-screen">
      <TopBar
        title="ExamLogic"
        subtitle="Welcome back, Victor 👋"
        showBack={false}
        showNotif={true}
        showAvatar={true}
        avatarInitial="V"
        notifCount={0}
        titleAlign="left"
      />

      <main className="px-4 pt-6 pb-28 flex flex-col items-center justify-center min-h-[75vh]">
        <EmptyState
          icon="📚"
          title="No sessions yet"
          description="You haven't started any practice sessions. Begin your first session to track your progress."
          action={{
            label: 'Start Practice',
            onClick: () => router.push('/practice'),
          }}
        />
      </main>

      <BottomNav />
    </div>
  )
}
