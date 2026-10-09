'use client'

// src/app/practice/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, BookOpen, Check, Clock3, LockKeyhole, Play, ShieldAlert, Target, Zap } from 'lucide-react'

const modes = [
  { name: 'Quick Fire', detail: 'Your daily habit. 20 sharp questions across all subjects, short enough to return to and focused enough to compound.', meta: '20 questions', href: '/quick-fire', color: '#FACC15', tint: 'rgba(250,204,21,.09)', icon: Zap, always: true },
  { name: 'Campaign', detail: 'Go deep on what matters. Pick a subject, pick a topic, and work at your own pace.', meta: 'Subject · Topic', href: '/campaign', color: '#25D6A2', tint: 'rgba(37,214,162,.09)', icon: Target, always: false },
  { name: 'Sudden Death', detail: 'Train your accuracy and composure. One incorrect answer ends the run.', meta: 'Accuracy challenge', href: '/sudden-death', color: '#FF7777', tint: 'rgba(255,119,119,.09)', icon: ShieldAlert, always: false },
  { name: 'JAMB Simulation', detail: 'Experience the full exam format with 180 questions in 2 hours.', meta: '180 questions · 2 hours', href: '/simulation', color: '#3FB7FF', tint: 'rgba(63,183,255,.09)', icon: BookOpen, always: false },
]

export default function PracticePage() {
  const router = useRouter()
  const [campaignUnlocked, setCampaignUnlocked] = useState(false)
  const [showUnlock, setShowUnlock] = useState(false)

  useEffect(() => {
    try {
      const unlocked = window.localStorage.getItem('examlogic:campaign-unlocked') === '1'
      setCampaignUnlocked(unlocked)
      if (window.sessionStorage.getItem('examlogic:show-campaign-unlock') === '1') {
        window.sessionStorage.removeItem('examlogic:show-campaign-unlock')
        setShowUnlock(true)
        window.setTimeout(() => setShowUnlock(false), 4200)
      }
    } catch {}
  }, [])

  return (
    <main style={{ minHeight: '100svh', padding: '28px 16px calc(110px + env(safe-area-inset-bottom))', background: '#E8E8E5', color: '#171A1C' }}>
      <div style={{ width: '100%', maxWidth: 620, margin: '0 auto' }}>
        <header style={{ marginBottom: 23 }}>
          <p style={{ margin: 0, color: '#25D6A2', fontSize: 10, fontWeight: 800, letterSpacing: '.13em' }}>YOUR TRAINING FLOOR</p>
          <h1 style={{ margin: '8px 0 0', fontSize: 30, lineHeight: 1.08, letterSpacing: '-.045em', fontWeight: 780 }}>Practice</h1>
          <p style={{ margin: '10px 0 0', maxWidth: 390, color: '#4B5560', fontSize: 13, lineHeight: 1.6 }}>Everything you need to prepare, drill, simulate and master JAMB, in one place.</p>
        </header>

        {showUnlock && <section role="status" style={{ display: 'flex', alignItems: 'start', gap: 12, padding: 16, marginBottom: 16, borderRadius: 15, border: '1px solid rgba(37,214,162,.35)', background: 'linear-gradient(120deg,rgba(37,214,162,.15),rgba(13,27,46,.98))', animation: 'practiceReveal .35s ease-out both' }}>
          <span style={{ width: 34, height: 34, flex: '0 0 34px', display: 'grid', placeItems: 'center', borderRadius: 10, background: 'rgba(37,214,162,.16)', color: '#25D6A2' }}><Check size={18}/></span>
          <div><strong style={{ display: 'block', fontSize: 15 }}>Campaign Unlocked</strong><p style={{ margin: '5px 0 0', color: '#A9C8C1', fontSize: 12, lineHeight: 1.5 }}>Practice any subject, any topic, at your own pace.</p></div>
        </section>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 11 }}>
          {modes.map((mode) => {
            const Icon = mode.icon
            const locked = !mode.always && mode.name === 'Campaign' && !campaignUnlocked
            return <button key={mode.name} type="button" onClick={() => { if (!locked) router.push(mode.href) }} disabled={locked} style={{ minWidth: 0, minHeight: 228, textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'stretch', padding: 15, borderRadius: 16, border: '1px solid ' + (locked ? 'rgba(23,26,28,.09)' : mode.color + '44'), background: locked ? '#EEEEEB' : 'linear-gradient(155deg,' + mode.tint + ',#F7F7F3 64%)', color: '#171A1C', opacity: locked ? .65 : 1, cursor: locked ? 'not-allowed' : 'pointer', transition: 'transform .18s ease,border-color .18s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: 12, background: mode.tint, color: mode.color }}><Icon size={19}/></span>
                {locked ? <LockKeyhole size={15} color="#718399"/> : <ArrowUpRight size={17} color={mode.color}/>}
              </div>
              <div style={{ marginTop: 19, flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 16, lineHeight: 1.2, fontWeight: 760, letterSpacing: '-.025em' }}>{mode.name}</h2>
                <p style={{ margin: '8px 0 0', color: '#4B5560', fontSize: 11, lineHeight: 1.55 }}>{locked ? 'Complete your first Quick Fire session to unlock Campaign.' : mode.detail}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 15, paddingTop: 11, borderTop: '1px solid rgba(23,26,28,.09)', color: mode.color, fontSize: 10, fontWeight: 750 }}><Clock3 size={12}/>{mode.meta}</div>
            </button>
          })}
        </div>
      </div>
      <style>{'@keyframes practiceReveal{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}'}</style>
    </main>
  )
}
