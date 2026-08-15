'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['500', '600', '700'] })

const navItems = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Subjects',
    href: '/subjects',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: 'Practice',
    href: '/practice',
    center: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8}>
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8}>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-[#1a3a5c] flex items-start justify-around pt-3 pb-3 md:hidden"
      style={{
        background: '#0d1f35ee',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href

        if (item.center) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 flex-1 px-3 py-1 rounded-xl"
            >
              <div
                className="w-[54px] h-[54px] rounded-[16px] flex items-center justify-center -mt-8"
                style={{
                  background: 'linear-gradient(135deg, #3FB7FF, #25d6a2)',
                  boxShadow: '0 8px 28px #25d6a265',
                }}
              >
                <svg
                  className="w-[22px] h-[22px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#071426"
                  strokeWidth={2}
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <span
                className="text-[10px] font-semibold text-[#25d6a2]"
                style={{ fontFamily: inter.style.fontFamily }}
              >
                {item.label}
              </span>
            </Link>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 flex-1 px-3 py-1 rounded-xl relative"
          >
            <svg
              className="w-[22px] h-[22px]"
              viewBox={item.icon.props.viewBox}
              fill="none"
              stroke={isActive ? '#25d6a2' : '#4d6a87'}
              strokeWidth={1.8}
            >
              {item.icon.props.children}
            </svg>

            <span
              className="text-[10px]"
              style={{
                fontFamily: inter.style.fontFamily,
                color: isActive ? '#25d6a2' : '#4d6a87',
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {item.label}
            </span>

            {isActive && (
              <span
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-t-[4px] bg-[#25d6a2]"
                style={{ boxShadow: '0 0 8px #25d6a2' }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
