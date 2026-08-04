// components/ui/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: (active: boolean) => React.ReactNode
  isCenter?: boolean
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
        stroke={active ? '#25d6a2' : '#4d6a87'} strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/subjects',
    label: 'Subjects',
    icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
        stroke={active ? '#25d6a2' : '#4d6a87'} strokeWidth={1.8}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    href: '/practice',
    label: 'Practice',
    isCenter: true,
    icon: () => (
      <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
        stroke="#071426" strokeWidth={2}>
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
        stroke={active ? '#25d6a2' : '#4d6a87'} strokeWidth={1.8}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
        stroke={active ? '#25d6a2' : '#4d6a87'} strokeWidth={1.8}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-[100]
      bg-[#0d1f35ee]
      backdrop-blur-lg
      border-t border-[#1a3a5c]
      pb-5 pt-2
      flex items-start justify-around
    ">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href)

        if (item.isCenter) {
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 flex-1 px-3"
            >
              <div className="
                w-11 h-11 rounded-[13px]
                flex items-center justify-center
                -mt-[14px]
                shadow-[0_4px_14px_#25d6a240]
              "
                style={{
                  background: 'linear-gradient(135deg, #3FB7FF, #25d6a2)',
                }}
              >
                {item.icon(false)}
              </div>
              <span className="
                font-['Inter'] text-[10px] font-semibold text-[#25d6a2]
              ">
                {item.label}
              </span>
            </Link>
          )
        }

        return (
          <Link key={item.href} href={item.href}
            className="relative flex flex-col items-center gap-1 flex-1 px-3 pt-1"
          >
            {/* Active indicator */}
            {active && (
              <span className="
                absolute -top-2 left-1/2 -translate-x-1/2
                w-6 h-[3px] rounded-b-[4px]
                bg-[#25d6a2]
                shadow-[0_0_8px_#25d6a2]
              " />
            )}
            {item.icon(active)}
            <span className={`
              font-['Inter'] text-[10px]
              ${active ? 'font-bold text-[#25d6a2]' : 'font-medium text-[#4d6a87]'}
            `}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
