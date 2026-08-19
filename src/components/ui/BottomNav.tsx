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
    <>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          borderTop: '1px solid #1a3a5c',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-around',
          paddingTop: '12px',
          paddingBottom: '12px',
          background: '#0d1f35ee',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        className="bottom-nav"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href

          if (item.center) {
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  flex: 1,
                  padding: '4px 12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '-32px',
                    background: 'linear-gradient(135deg, #3FB7FF, #25d6a2)',
                    boxShadow: '0 8px 28px #25d6a265',
                  }}
                >
                  <svg
                    width={22}
                    height={22}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#071426"
                    strokeWidth={2}
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <span
                  style={{
                    fontFamily: inter.style.fontFamily,
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#25d6a2',
                  }}
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
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                flex: 1,
                padding: '4px 12px',
                borderRadius: '12px',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              <svg
                width={22}
                height={22}
                viewBox={item.icon.props.viewBox}
                fill="none"
                stroke={isActive ? '#25d6a2' : '#4d6a87'}
                strokeWidth={1.8}
              >
                {item.icon.props.children}
              </svg>

              <span
                style={{
                  fontFamily: inter.style.fontFamily,
                  fontSize: '10px',
                  color: isActive ? '#25d6a2' : '#4d6a87',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {item.label}
              </span>

              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '24px',
                    height: '3px',
                    borderRadius: '4px 4px 0 0',
                    backgroundColor: '#25d6a2',
                    boxShadow: '0 0 8px #25d6a2',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .bottom-nav { display: none; }
        }
      `}</style>
    </>
  )
                    }
