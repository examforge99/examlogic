'use client'

import { Bell, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
      .then(r => r.ok ? r.json() : null)
      .then(data => setHasNotification(Boolean(data?.hasNotification)))
      .catch(() => setHasNotification(false))
  }, [showNotif])

  return (
    <header className="app-topbar">
      <div className="app-topbar-inner">
        <div className="app-topbar-leading">
          {showBack ? (
            <button className="icon-control" type="button" aria-label="Go back" onClick={() => router.back()}>
              <ChevronLeft size={18} />
            </button>
          ) : null}

          <div className="app-topbar-copy">
            <p className="app-topbar-title">{title ?? 'ExamLogic'}</p>
            {subtitle ? <p className="app-topbar-subtitle">{subtitle}</p> : null}
          </div>
        </div>

        {rightElement ?? (
          <div className="app-topbar-actions">
            {showNotif ? (
              <button className="icon-control" type="button" aria-label="Notifications" onClick={onNotifClick}>
                <Bell size={17} />
                {hasNotification ? <span className="notification-dot" aria-hidden="true" /> : null}
              </button>
            ) : null}

            {showAvatar ? (
              <button className="avatar-control" type="button" aria-label="Open profile" onClick={onAvatarClick}>
                {avatarInitial}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </header>
  )
}
