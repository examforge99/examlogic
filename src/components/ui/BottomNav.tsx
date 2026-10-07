'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, BookOpen, House, Play, UserRound } from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/dashboard', icon: House },
  { label: 'Subjects', href: '/subjects', icon: BookOpen },
  { label: 'Practice', href: '/practice', icon: Play, center: true },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Profile', href: '/profile', icon: UserRound },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {navItems.map(({ label, href, icon: Icon, center }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

          return (
            <Link
              key={href}
              href={href}
              className={center ? 'bottom-nav-item bottom-nav-practice' : 'bottom-nav-item'}
              aria-current={active ? 'page' : undefined}
            >
              {center ? (
                <span className="bottom-nav-practice-button" aria-hidden="true">
                  <Icon size={21} strokeWidth={2} />
                </span>
              ) : (
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              )}
              <span>{label}</span>
              {!center && active ? <span className="bottom-nav-active-marker" aria-hidden="true" /> : null}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
