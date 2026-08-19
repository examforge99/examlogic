'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Space_Grotesk, Inter } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'] })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

interface TopBarProps {
  title?: string
  subtitle?: string
  showBack?: boolean
  showNotif?: boolean
  showAvatar?: boolean
  avatarInitial?: string
  rightElement?: React.ReactNode
  onNotifClick?: () => void
  onAvatarClick?: () => void
}

export default function TopBar({
  title,
  subtitle,
  showBack = false,
  showNotif = true,
  showAvatar = true,
  avatarInitial = 'V',
  rightElement,
  onNotifClick,
  onAvatarClick,
}: TopBarProps) {
  const router = useRouter()
  const [hasNotification, setHasNotification] = useState(false)

  useEffect(() => {
    if (!showNotif) return
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data) => setHasNotification(data.hasNotification))
      .catch(() => setHasNotification(false))
  }, [showNotif])

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(7, 20, 38, 0.93)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1a3a5c',
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    }}>

      {/* Left — logo or back button */}
      <div style={{ flexShrink: 0 }}>
        {showBack ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.back()}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                backgroundColor: '#0d1f35',
                border: '1px solid #1a3a5c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'opacity 0.15s ease',
              }}
              onMouseDown={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              onMouseUp={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a8c8e8" strokeWidth={2}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {title && (
              <p
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#e8f4ff',
                  lineHeight: 1,
                  fontFamily: spaceGrotesk.style.fontFamily,
                  margin: 0,
                }}
              >
                {title}
              </p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p
              style={{
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1,
                fontFamily: spaceGrotesk.style.fontFamily,
                margin: 0,
              }}
            >
              <span style={{ color: '#e8f4ff' }}>Exam</span>
              <span style={{ color: '#25d6a2' }}>Logic</span>
            </p>
            {subtitle && (
              <p
                style={{
                  fontSize: '11px',
                  color: '#4d6a87',
                  fontFamily: inter.style.fontFamily,
                  margin: 0,
                  marginTop: '2px',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right — notif + avatar or custom element */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {rightElement ?? (
          <>
            {showNotif && (
              <button
                onClick={onNotifClick}
                style={{
                  position: 'relative',
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  backgroundColor: '#0d1f35',
                  border: '1px solid #1a3a5c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                }}
                onMouseDown={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                onMouseUp={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a8c8e8" strokeWidth={2}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {hasNotification && (
                  <span style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#3FB7FF',
                    border: '1.5px solid #071426',
                  }} />
                )}
              </button>
            )}

            {showAvatar && (
              <button
                onClick={onAvatarClick}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#071426',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s ease',
                  fontFamily: spaceGrotesk.style.fontFamily,
                  background: 'linear-gradient(135deg, #3FB7FF, #25d6a2)',
                }}
                onMouseDown={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                onMouseUp={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {avatarInitial}
              </button>
            )}
          </>
        )}
      </div>

    </div>
  )
}
