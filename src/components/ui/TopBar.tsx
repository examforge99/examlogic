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
    <div className="
      sticky top-0 z-[100]
      bg-[#071426ee]
      backdrop-blur-md
      border-b border-[#1a3a5c]
      px-10 py-[10px]
      flex items-center justify-between
      gap-3
    ">

      {/* Left — logo or back button */}
      <div className="flex-shrink-0">
        {showBack ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="
                w-[34px] h-[34px] rounded-[9px]
                bg-[#0d1f35] border border-[#1a3a5c]
                flex items-center justify-center
                active:opacity-70 transition-opacity
              "
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a8c8e8" strokeWidth={2}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {title && (
              <p
                className="text-[17px] font-bold text-[#e8f4ff] leading-none"
                style={{ fontFamily: spaceGrotesk.style.fontFamily }}
              >
                {title}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            <p
              className="text-[18px] font-bold tracking-tight leading-none"
              style={{ fontFamily: spaceGrotesk.style.fontFamily }}
            >
              <span className="text-[#e8f4ff]">Exam</span>
              <span className="text-[#25d6a2]">Logic</span>
            </p>
            {subtitle && (
              <p
                className="text-[11px] text-[#4d6a87] mt-[2px]"
                style={{ fontFamily: inter.style.fontFamily }}
              >
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right — notif + avatar or custom element */}
      <div className="flex items-center gap-[10px] flex-shrink-0">
        {rightElement ?? (
          <>
            {showNotif && (
              <button
                onClick={onNotifClick}
                className="
                  relative w-[34px] h-[34px] rounded-[9px]
                  bg-[#0d1f35] border border-[#1a3a5c]
                  flex items-center justify-center
                  active:opacity-70 transition-opacity
                "
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#a8c8e8" strokeWidth={2}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {hasNotification && (
                  <span className="
                    absolute top-[5px] right-[5px]
                    w-[6px] h-[6px] rounded-full
                    bg-[#3FB7FF]
                    border-[1.5px] border-[#071426]
                  " />
                )}
              </button>
            )}

            {showAvatar && (
              <button
                onClick={onAvatarClick}
                className="
                  w-[34px] h-[34px] rounded-[9px]
                  flex items-center justify-center
                  text-[13px] font-bold text-[#071426]
                  active:opacity-70 transition-opacity
                "
                style={{
                  fontFamily: spaceGrotesk.style.fontFamily,
                  background: 'linear-gradient(135deg, #3FB7FF, #25d6a2)',
                }}
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
