'use client'

import { useRouter } from 'next/navigation'
import { BookOpen, CalendarClock, Play, Trophy } from 'lucide-react'
import { dashboardColors as C } from './styles'

const links = [
  { label: 'Home', href: '/dashboard', Icon: CalendarClock },
  { label: 'Practice', href: '/practice', Icon: Play },
  { label: 'Subscription', href: '/subscription', Icon: Trophy },
  { label: 'Profile', href: '/profile', Icon: BookOpen },
]

export default function DashboardNavigation() {
  const router = useRouter()

  return (
    <nav aria-label="Main navigation" style={{ position: 'fixed', zIndex: 20, bottom: 0, left: 0, right: 0, padding: '9px 10px calc(9px + env(safe-area-inset-bottom))', background: 'rgba(247,247,243,.94)', borderTop: '1px solid ' + C.border, backdropFilter: 'blur(18px)' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
        {links.map(({ label, href, Icon }) => (
          <button key={href} onClick={() => router.push(href)} aria-current={href === '/dashboard' ? 'page' : undefined} style={{ minHeight: 46, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 3, borderRadius: 10, color: href === '/dashboard' ? '#0876B8' : C.muted, fontSize: 10, fontWeight: 700 }}>
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
