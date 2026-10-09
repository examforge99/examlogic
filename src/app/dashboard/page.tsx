'use client'

// src/app/dashboard/page.tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ArrowRight, Bell, BookOpen, CalendarClock, Flame, Menu, Play, Sparkles, Trophy, X } from 'lucide-react'
import TodayMission, { type Mission } from '@/components/nba/TodayMission'
import { COLORS } from '@/lib/design/colors'

type DashboardData = {
  missions: Mission[]
  schedule: { planned_seconds: number; used_seconds: number; remaining_seconds: number; subjects: string[]; day_type: 'practice' | 'rest' } | null
}

const C = {
  bg: COLORS.background, surface: COLORS.surface, elevated: COLORS.elevated,
  primary: COLORS.primary, accent: COLORS.accent, text: COLORS.text.primary,
  muted: COLORS.text.muted, border: COLORS.border,
}
const css = {
  shell: { minHeight: '100svh', background: C.bg, color: C.text, paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' } as const,
  main: { maxWidth: 620, width: '100%', margin: '0 auto', padding: '18px 16px 30px', display: 'grid', gap: 16, boxSizing: 'border-box' as const },
  panel: { border: '1px solid ' + C.border, borderRadius: 16, background: C.surface, padding: 16 } as const,
  label: { margin: 0, color: C.muted, fontSize: 10, fontWeight: 750, letterSpacing: '.11em', textTransform: 'uppercase' as const },
  title: { margin: '5px 0 0', fontSize: 20, lineHeight: 1.2, letterSpacing: '-.035em', fontWeight: 750 } as const,
  sub: { margin: '6px 0 0', color: C.muted, fontSize: 12, lineHeight: 1.55 } as const,
  action: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 0, borderRadius: 10, padding: '11px 14px', background: C.primary, color: '#061626', fontWeight: 750, fontSize: 12 } as const,
}
function fmt(seconds: number) {
  const m = Math.max(0, Math.round(seconds / 60)), h = Math.floor(m / 60), r = m % 60
  return h ? (r ? h + 'h ' + r + 'm' : h + 'h') : r + 'm'
}
export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [errors, setErrors] = useState({ mission: false, schedule: false })
  const [firstUse, setFirstUse] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [trialState, setTrialState] = useState<'offer' | 'free' | 'active'>('offer')
  const [examDate, setExamDate] = useState<string | null>(null)

  const firstName = user?.firstName || user?.username || 'there'
  const greeting = useMemo(() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  }, [])

  useEffect(() => {
    try {
      setFirstUse(!window.localStorage.getItem('examlogic:first-session-started'))
      const savedExamDate = window.localStorage.getItem('examlogic:exam-date')
      if (savedExamDate) setExamDate(savedExamDate)
    } catch { /* storage may be unavailable; keep the dashboard usable */ }
  }, [])

  const loadDashboard = useCallback(async () => {
    const headers = { Accept: 'application/json', 'Cache-Control': 'no-cache, no-store, max-age=0' }
    const results = await Promise.allSettled([
      fetch('/api/nba/fire', { method: 'POST', cache: 'no-store', headers }).then(async r => { if (!r.ok) throw new Error('mission'); return r.json() }),
      fetch('/api/timetable/today', { cache: 'no-store', headers }).then(async r => { if (!r.ok) throw new Error('schedule'); return r.json() }),
    ])
    setErrors({ mission: results[0].status === 'rejected', schedule: results[1].status === 'rejected' })
    setData({
      missions: results[0].status === 'fulfilled' && Array.isArray(results[0].value?.missions) ? results[0].value.missions : [],
      schedule: results[1].status === 'fulfilled' ? results[1].value : null,
    })
  }, [])
  useEffect(() => { if (isLoaded) void loadDashboard() }, [isLoaded, loadDashboard])

  const beginFirstSession = () => {
    try { window.localStorage.setItem('examlogic:first-session-started', '1') } catch {}
    setFirstUse(false)
    router.push('/quick-fire')
  }
  const today = new Date()
  const daysRemaining = examDate ? Math.max(0, Math.ceil((new Date(examDate).getTime() - today.getTime()) / 86400000)) : null
  const totalPrepDays = examDate ? Math.max(1, Math.ceil((new Date(examDate).getTime() - new Date(user?.createdAt || today).getTime()) / 86400000)) : null
  const ringProgress = daysRemaining !== null && totalPrepDays ? Math.max(0, Math.min(100, daysRemaining / totalPrepDays * 100)) : 34
  const schedule = data?.schedule
  const used = schedule?.used_seconds ?? 0
  const planned = schedule?.planned_seconds ?? 0

  return (
    <div style={css.shell}>
      <header style={{ maxWidth: 620, margin: '0 auto', padding: '17px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button aria-label="Open menu" onClick={() => setMenuOpen(v => !v)} style={{ color: C.text, display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 11, background: C.surface, border: '1px solid ' + C.border }}><Menu size={19}/></button>
        <button onClick={() => router.push('/dashboard')} style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-.045em', color: C.text }}>Exam<span style={{ color: C.primary }}>Logic</span></button>
        <button aria-label="Notifications" onClick={() => setNotifOpen(v => !v)} style={{ position: 'relative', color: C.text, display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 11, background: C.surface, border: '1px solid ' + C.border }}><Bell size={18}/><span style={{ position: 'absolute', width: 6, height: 6, right: 8, top: 7, borderRadius: 99, background: C.accent }}/></button>
      </header>

      {menuOpen && <div style={{ maxWidth: 620, margin: '0 auto', padding: '4px 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[['Analytics','/analytics'],['Settings','/settings'],['Help','/help']].map(([label,href]) => <button key={href} onClick={() => router.push(href)} style={{ padding: '9px 12px', borderRadius: 9, border: '1px solid ' + C.border, background: C.surface, color: C.text, fontSize: 12 }}>{label}</button>)}
      </div>}
      {notifOpen && <div style={{ maxWidth: 588, margin: '0 auto 8px', padding: '12px 16px', borderRadius: 12, border: '1px solid ' + C.border, background: C.surface, fontSize: 12 }}><strong>Welcome to ExamLogic</strong><p style={css.sub}>Your preparation starts with your first session. Your progress will appear here as you study.</p></div>}

      <main style={css.main}>
        <section aria-label="Exam countdown" style={{ ...css.panel, background: 'linear-gradient(135deg, #102942, #0D1B2E 72%)', display: 'flex', alignItems: 'center', gap: 18, overflow: 'hidden' }}>
          <div style={{ width: 118, height: 118, flex: '0 0 118px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'conic-gradient(' + C.primary + ' ' + ringProgress + '%, rgba(255,255,255,.09) 0)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', background: '#0D1B2E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <strong style={{ fontSize: daysRemaining === null ? 24 : 31, letterSpacing: '-.05em' }}>{daysRemaining === null ? 'TBA' : daysRemaining}</strong>
              <span style={{ fontSize: 9, color: C.muted, textTransform: 'uppercase', letterSpacing: '.08em' }}>{daysRemaining === null ? 'JAMB date' : 'days to JAMB'}</span>
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={css.label}>Your exam countdown</p>
            <h1 style={{ ...css.title, fontSize: 18 }}>{daysRemaining === null ? 'Build your momentum.' : daysRemaining === 0 ? 'Exam day is here.' : 'Every session counts.'}</h1>
            <p style={css.sub}>{daysRemaining === null ? 'JAMB date has not been announced. Keep preparing.' : 'A little progress today keeps your preparation moving.'}</p>
          </div>
        </section>

        <section aria-label="Next best action" style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
            <p style={css.label}>Next move</p><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: C.accent, fontSize: 10, fontWeight: 750 }}><Sparkles size={12}/> PERSONALIZED</span>
          </div>
          <TodayMission initialMissions={data?.missions} deferFetch initialError={errors.mission ? 'Your next recommendation is temporarily unavailable. Try again shortly.' : null} onDashboardRefresh={loadDashboard} />
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
          <section style={{ ...css.panel, padding: 14, background: '#10263A' }}>
            <div style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 9, background: 'rgba(63,183,255,.12)', color: C.primary }}><CalendarClock size={16}/></div>
            <p style={{ ...css.label, marginTop: 15, letterSpacing: '.03em' }}>Yesterday's study time</p>
            <p style={{ fontSize: 25, fontWeight: 780, letterSpacing: '-.04em', marginTop: 5 }}>--</p>
            <p style={{ ...css.sub, marginTop: 3 }}>Time spent learning</p>
          </section>
          <section style={{ ...css.panel, padding: 14, background: '#122B2B' }}>
            <div style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', borderRadius: 9, background: 'rgba(37,214,162,.12)', color: C.accent }}><Flame size={16}/></div>
            <p style={{ ...css.label, marginTop: 15, letterSpacing: '.03em' }}>Today's time used</p>
            <p style={{ fontSize: 25, fontWeight: 780, letterSpacing: '-.04em', marginTop: 5 }}>{planned ? fmt(used) + ' / ' + fmt(planned) : '--'}</p>
            <p style={{ ...css.sub, marginTop: 3 }}>{planned ? fmt(Math.max(0, planned - used)) + ' remaining' : 'Your daily commitment'}</p>
          </section>
        </div>

        <button onClick={() => router.push('/practice')} style={{ ...css.panel, width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', color: C.text, background: '#132D43', borderColor: 'rgba(63,183,255,.24)' }}>
          <span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, background: C.primary, color: '#071426' }}><Play size={19} fill="currentColor"/></span>
          <span style={{ flex: 1 }}><strong style={{ display: 'block', fontSize: 15 }}>Start practicing</strong><span style={{ ...css.sub, display: 'block', marginTop: 3 }}>Choose a mode and keep moving.</span></span><ArrowRight size={17} color={C.primary}/>
        </button>

        {schedule && <section style={css.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
            <div><p style={css.label}>Today's preparation</p><h2 style={{ ...css.title, fontSize: 16 }}>{schedule.day_type === 'practice' ? 'On your schedule' : 'A lighter day'}</h2></div>
            <button onClick={() => router.push('/timetable')} aria-label="Open timetable" style={{ color: C.primary, padding: 4 }}><ArrowRight size={17}/></button>
          </div>
          {schedule.subjects?.length ? <p style={css.sub}>{schedule.subjects.join(' · ')}</p> : <p style={css.sub}>No subjects scheduled today.</p>}
        </section>}

        {trialState !== 'active' && <section style={{ ...css.panel, background: '#171F38', borderColor: 'rgba(167,139,250,.22)' }}>
          <p style={css.label}>ExamLogic Plus</p>
          <h2 style={{ ...css.title, fontSize: 16 }}>{trialState === 'offer' ? 'Unlock your first month.' : 'Keep your preparation going.'}</h2>
          <p style={css.sub}>{trialState === 'offer' ? 'Explore the full preparation experience with your free trial.' : 'See plans designed for your exam journey.'}</p>
          <button onClick={() => router.push('/subscription')} style={{ ...css.action, marginTop: 13, background: '#A78BFA' }}>{trialState === 'offer' ? 'Explore free trial' : 'View plans'} <ArrowRight size={14}/></button>
        </section>}
      </main>

      <nav aria-label="Main navigation" style={{ position: 'fixed', zIndex: 20, bottom: 0, left: 0, right: 0, padding: '9px 10px calc(9px + env(safe-area-inset-bottom))', background: 'rgba(7,20,38,.94)', borderTop: '1px solid ' + C.border, backdropFilter: 'blur(18px)' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
          {[['Home','/dashboard',CalendarClock],['Practice','/practice',Play],['Subscription','/subscription',Trophy],['Profile','/profile',BookOpen]].map(([label,href,Icon]: any) => <button key={href} onClick={() => router.push(href)} style={{ minHeight: 46, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 3, borderRadius: 10, color: href === '/dashboard' ? C.primary : C.muted, fontSize: 10, fontWeight: 700 }}><Icon size={17}/>{label}</button>)}
        </div>
      </nav>

      {firstUse && <div role="dialog" aria-modal="true" aria-labelledby="first-use-title" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', padding: 22, background: 'rgba(2,8,17,.76)', backdropFilter: 'blur(7px)' }}>
        <div style={{ width: '100%', maxWidth: 360, padding: 24, borderRadius: 22, border: '1px solid rgba(63,183,255,.22)', background: '#0D1B2E', boxShadow: '0 28px 90px rgba(0,0,0,.48)' }}>
          <div style={{ width: 46, height: 46, display: 'grid', placeItems: 'center', borderRadius: 14, background: 'rgba(63,183,255,.12)', color: C.primary, marginBottom: 20 }}><Sparkles size={22}/></div>
          <h2 id="first-use-title" style={{ fontSize: 25, letterSpacing: '-.04em', lineHeight: 1.15 }}>You're in. 👋</h2>
          <p style={{ ...css.sub, fontSize: 14, marginTop: 10 }}>Let's start with a quick practice session.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 0', marginTop: 12, borderTop: '1px solid ' + C.border, borderBottom: '1px solid ' + C.border, fontSize: 13 }}><span style={{ color: C.muted }}>Quick Fire</span><strong>20 questions</strong></div>
          <button onClick={beginFirstSession} style={{ ...css.action, width: '100%', marginTop: 18, height: 46 }}>Begin <ArrowRight size={15}/></button>
          <p style={{ color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 13 }}>This is where your preparation begins.</p>
        </div>
      </div>}
    </div>
  )
}
