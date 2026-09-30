'use client'

import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import TodayMission from '@/components/nba/TodayMission'
import RecentActivity from '@/components/RecentActivity'

export default function DashboardPage() {
  return (
    <div style={{ backgroundColor: '#071426' }} className="min-h-screen">
      <TopBar showBack={false} showNotif={true} showAvatar={true} avatarInitial="V" />

      <style>{`
        .dashboard-content { padding-bottom: 120px; }
        .dashboard-content .nba-prototype { min-height: auto; margin: 0; padding: 0; background: transparent; color: #D8E0E8; font-family: Inter, system-ui, sans-serif; }
        .dashboard-content .mission-card { position: relative; overflow: visible; width: 100%; margin: 0; padding: 21px; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; background: #0D1B2E; box-shadow: 0 20px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08); }
        .dashboard-content .card-topline { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
        .dashboard-content .identity-tag { display: inline-flex; align-items: center; min-height: 28px; padding: 0 11px; border: 1px solid rgba(255,255,255,.16); border-radius: 8px; background: rgba(255,255,255,.025); color: #D8E0E8; font-size: 10px; font-weight: 800; letter-spacing: .13em; line-height: 1; }
        .dashboard-content .nba-tag { border-color: rgba(63,183,255,.34); background: rgba(63,183,255,.06); color: #3FB7FF; }
        .dashboard-content .recommendation-body { display: block; margin-top: 20px; }
        .dashboard-content .concept-title { margin: 0; color: #D8E0E8; font-size: 22px; line-height: 1.22; letter-spacing: -.02em; }
        .dashboard-content .detail { margin: 13px 0 0; color: rgba(232,240,247,.57); font-size: 13px; line-height: 1.6; }
        .dashboard-content .primary { width: 100%; min-height: 50px; margin-top: 23px; border: 1px solid #3FB7FF; border-radius: 12px; background: linear-gradient(105deg,#2766F3 0%,#1E8CEB 52%,#1ED0A7 100%); color: #06182A; font: 700 13px Inter, system-ui, sans-serif; }
        .dashboard-content .recent-activity { width: 100%; margin: 16px 0 0; padding: 21px; box-sizing: border-box; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; background: #0D1B2E; box-shadow: 0 20px 40px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08); color: #D8E0E8; }
        .dashboard-content .recent-activity-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
        .dashboard-content .recent-activity-header h2 { margin: 0; color: #f1f6fa; font-size: 16px; font-weight: 700; line-height: 1.2; }
        .dashboard-content .recent-activity-header p { margin: 4px 0 0; color: rgba(232,240,247,.42); font-size: 10px; line-height: 1.4; }
        @media (min-width: 768px) { .dashboard-content { padding-bottom: 40px; } }
      `}</style>
      <main className="dashboard-content px-4 pt-2">
        <TodayMission />
        <RecentActivity />
      </main>

      <BottomNav />
    </div>
  )
}
