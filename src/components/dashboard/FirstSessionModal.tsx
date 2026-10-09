'use client'

import { ArrowRight, Sparkles } from 'lucide-react'
import { dashboardColors as C, dashboardStyles as css } from './styles'

type FirstSessionModalProps = {
  open: boolean
  onStart: () => void
}

export default function FirstSessionModal({ open, onStart }: FirstSessionModalProps) {
  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="first-use-title" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', padding: 22, background: 'rgba(2,8,17,.76)', backdropFilter: 'blur(7px)' }}>
      <div style={{ width: '100%', maxWidth: 360, padding: 24, borderRadius: 22, border: '1px solid rgba(63,183,255,.22)', background: '#F7F7F3', boxShadow: '0 28px 90px rgba(0,0,0,.25)' }}>
        <div style={{ width: 46, height: 46, display: 'grid', placeItems: 'center', borderRadius: 14, background: 'rgba(63,183,255,.16)', color: '#0876B8', marginBottom: 20 }}>
          <Sparkles size={22} />
        </div>
        <h2 id="first-use-title" style={{ fontSize: 25, letterSpacing: '-.04em', lineHeight: 1.15, color: C.text }}>You're in. 👋</h2>
        <p style={{ ...css.sub, fontSize: 14, marginTop: 10 }}>Let's start with a quick practice session.</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 0', marginTop: 12, borderTop: '1px solid ' + C.border, borderBottom: '1px solid ' + C.border, fontSize: 13 }}>
          <span style={{ color: C.muted }}>Quick Fire</span>
          <strong>20 questions</strong>
        </div>
        <button onClick={onStart} style={{ ...css.action, width: '100%', marginTop: 18, height: 46 }}>
          Begin <ArrowRight size={15} />
        </button>
        <p style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 13 }}>This is where your preparation begins.</p>
      </div>
    </div>
  )
}
