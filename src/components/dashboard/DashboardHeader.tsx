'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'
import { dashboardColors as C, dashboardStyles as css } from './styles'

export default function DashboardHeader() {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <>
      <header style={{ maxWidth: 620, margin: '0 auto', padding: '17px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)} style={{ color: C.text, display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 11, background: C.surface, border: '1px solid ' + C.border }}>
          <Menu size={19} />
        </button>
        <button onClick={() => router.push('/dashboard')} style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.045em', color: C.text }}>
          Exam<span style={{ color: C.primary }}>Logic</span>
        </button>
        <button aria-label="Notifications" aria-expanded={notifOpen} onClick={() => setNotifOpen(value => !value)} style={{ position: 'relative', color: C.text, display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 11, background: C.surface, border: '1px solid ' + C.border }}>
          <Bell size={18} />
          <span aria-hidden="true" style={{ position: 'absolute', width: 6, height: 6, right: 8, top: 7, borderRadius: 99, background: C.accent }} />
        </button>
      </header>

      {menuOpen && (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '4px 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            ['Analytics', '/analytics'],
            ['Settings', '/settings'],
            ['Help', '/help'],
          ].map(([label, href]) => (
            <button key={href} onClick={() => router.push(href)} style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid ' + C.border, background: C.surface, color: C.text, fontSize: 12 }}>
              {label}
            </button>
          ))}
        </div>
      )}

      {notifOpen && (
        <div style={{ maxWidth: 588, margin: '0 auto 8px', padding: '12px 16px', borderRadius: 12, border: '1px solid ' + C.border, background: C.surface, fontSize: 12 }}>
          <strong>Welcome to ExamLogic</strong>
          <p style={css.sub}>Your preparation starts with your first session. Your progress will appear here as you study.</p>
        </div>
      )}
    </>
  )
}
