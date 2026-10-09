'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, MessageCircle, ShieldCheck } from 'lucide-react'

const C = { bg: '#F7F7F3', surface: '#FFFFFF', text: '#17232C', muted: '#687782', blue: '#0876B8', border: '#DCE4E8' }

export default function HelpPage() {
  const router = useRouter()
  return <main style={{ minHeight: '100svh', background: C.bg, color: C.text, padding: '22px 16px calc(30px + env(safe-area-inset-bottom))' }}>
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid ' + C.border, background: C.surface, borderRadius: 10, padding: '9px 12px', color: C.text }}><ArrowLeft size={15}/> Back</button>
      <p style={{ color: C.blue, fontSize: 10, fontWeight: 800, letterSpacing: '.13em', marginTop: 28 }}>EXAMLOGIC SUPPORT</p>
      <h1 style={{ fontSize: 29, letterSpacing: '-.04em', margin: '7px 0' }}>How can we help?</h1>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6 }}>Find your way around ExamLogic or return to your preparation.</p>
      <div style={{ display: 'grid', gap: 10, marginTop: 22 }}>
        {[
          { icon: BookOpen, title: 'Getting started', detail: 'Choose a practice mode and complete your first session.', href: '/practice' },
          { icon: ShieldCheck, title: 'Account access', detail: 'Manage your sign-in from the account screen.', href: '/auth' },
          { icon: MessageCircle, title: 'Progress and analytics', detail: 'See your consistency and practice history.', href: '/analytics' },
        ].map(({icon:Icon,title,detail,href}) => <button key={title} onClick={() => router.push(href)} style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', padding: 16, border: '1px solid ' + C.border, borderRadius: 14, background: C.surface, color: C.text }}>
          <span style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 11, background: '#E8F4FA', color: C.blue, flexShrink: 0 }}><Icon size={18}/></span>
          <span><strong style={{ display: 'block', fontSize: 14 }}>{title}</strong><span style={{ display: 'block', marginTop: 5, color: C.muted, fontSize: 12, lineHeight: 1.5 }}>{detail}</span></span>
        </button>)}
      </div>
      <button onClick={() => router.push('/dashboard')} style={{ width: '100%', marginTop: 18, padding: 14, border: 0, borderRadius: 11, background: C.blue, color: '#fff', fontWeight: 750 }}>Return to dashboard</button>
    </div>
  </main>
}
