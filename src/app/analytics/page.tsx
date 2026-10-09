'use client'

// src/app/analytics/page.tsx
import { useState } from 'react'
import { Activity, BarChart3, CalendarDays, ChartNoAxesCombined, History, Layers3 } from 'lucide-react'
import TopBar from '@/components/ui/TopBar'
import BottomNav from '@/components/ui/BottomNav'
import StatCard from '@/components/analytics/StatCard'
import AccuracyTrendChart from '@/components/analytics/AccuracyTrendChart'
import DifficultyPerformanceCard from '@/components/analytics/DifficultyPerformanceCard'
import HeatMap from '@/components/analytics/HeatMap'
import PracticeModeCard from '@/components/analytics/PracticeModeCard'

const tabs = [
  { id: 'consistency', label: 'Consistency', question: 'Am I showing up?', icon: CalendarDays },
  { id: 'history', label: 'Practice history', question: 'What have I done?', icon: History },
  { id: 'performance', label: 'Performance', question: 'How am I doing it?', icon: ChartNoAxesCombined },
  { id: 'subjects', label: 'Subjects', question: 'Where is my attention needed?', icon: Layers3 },
  { id: 'modes', label: 'Mode effectiveness', question: 'Which mode works for me?', icon: BarChart3 },
] as const
type TabId = typeof tabs[number]['id']

export default function AnalyticsPage() {
  const [active, setActive] = useState<TabId>('consistency')
  const selected = tabs.find(tab => tab.id === active)!

  return <div style={{ minHeight: '100svh', backgroundColor: '#E8E8E5', color: '#171A1C', paddingBottom: 'calc(90px + env(safe-area-inset-bottom))' }}>
    <TopBar title="Analytics" subtitle="Your preparation, clearly laid out" showBack={false} showNotif={true} showAvatar={false}/>
    <main style={{ width: '100%', maxWidth: 620, margin: '0 auto', padding: '18px 16px 30px', boxSizing: 'border-box' }}>
      <section style={{ marginBottom: 21 }}>
        <p style={{ margin: 0, color: '#25D6A2', fontSize: 10, fontWeight: 800, letterSpacing: '.12em' }}>YOUR RECORD</p>
        <h1 style={{ margin: '7px 0 0', fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 26, lineHeight: 1.12, letterSpacing: '-.04em', fontWeight: 750 }}>Learning, in context.</h1>
        <p style={{ margin: '8px 0 0', maxWidth: 400, color: '#4B5560', fontSize: 12, lineHeight: 1.6 }}>A clear view of what you've practised and the patterns your activity is creating. No verdicts, just useful signals.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8, marginTop: 17 }}>
          <StatCard value="—" label="Questions" valueColor="#3FB7FF" iconBg="transparent" icon={<Activity size={14} color="#3FB7FF"/>} className="analytics-stat"/>
          <StatCard value="—" suffix="" label="Study time" valueColor="#A78BFA" iconBg="transparent" icon={<History size={14} color="#A78BFA"/>} className="analytics-stat"/>
          <StatCard value="—" suffix="" label="Study streak" valueColor="#FF8C55" iconBg="transparent" icon={<CalendarDays size={14} color="#FF8C55"/>} className="analytics-stat"/>
        </div>
      </section>

      <div role="tablist" aria-label="Analytics views" style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '2px 0 10px', scrollbarWidth: 'none' }}>
        {tabs.map(tab => { const Icon = tab.icon; const chosen = active === tab.id; return <button key={tab.id} type="button" role="tab" aria-selected={chosen} onClick={() => setActive(tab.id)} style={{ flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 12px', borderRadius: 10, border: '1px solid ' + (chosen ? 'rgba(63,183,255,.35)' : 'rgba(23,26,28,.09)'), background: chosen ? 'rgba(63,183,255,.1)' : '#F7F7F3', color: chosen ? '#3FB7FF' : '#4B5560', fontSize: 10, fontWeight: 750, whiteSpace: 'nowrap' }}><Icon size={13}/>{tab.label}</button> }) }
      </div>

      <section role="tabpanel" aria-label={selected.label} style={{ marginTop: 10 }}>
        <div style={{ marginBottom: 15, padding: '15px 15px 14px', borderRadius: 14, border: '1px solid rgba(23,26,28,.09)', background: '#F7F7F3' }}>
          <p style={{ margin: 0, color: '#737B83', fontSize: 9, fontWeight: 800, letterSpacing: '.12em' }}>{selected.label.toUpperCase()}</p>
          <h2 style={{ margin: '6px 0 0', fontSize: 18, letterSpacing: '-.025em' }}>{selected.question}</h2>
        </div>
        {active === 'consistency' && <HeatMap/>}
        {active === 'history' && <div style={{ padding: 19, borderRadius: 14, border: '1px solid rgba(23,26,28,.09)', background: '#F7F7F3' }}><History size={21} color="#3FB7FF"/><h3 style={{ margin: '12px 0 0', fontSize: 15 }}>Your practice history</h3><p style={{ margin: '7px 0 0', color: '#4B5560', fontSize: 12, lineHeight: 1.6 }}>Completed sessions will appear here with their mode, questions, and topics covered.</p></div>}
        {active === 'performance' && <div style={{ display: 'grid', gap: 20 }}><AccuracyTrendChart/><DifficultyPerformanceCard/></div>}
        {active === 'subjects' && <div style={{ display: 'grid', gap: 15 }}><div style={{ padding: 18, borderRadius: 14, border: '1px solid rgba(23,26,28,.09)', background: '#F7F7F3' }}><Layers3 size={20} color="#25D6A2"/><h3 style={{ margin: '11px 0 0', fontSize: 15 }}>Subject breakdown</h3><p style={{ margin: '7px 0 0', color: '#4B5560', fontSize: 12, lineHeight: 1.6 }}>As you practise, subject-level accuracy and topic patterns will build into a useful comparison.</p></div><AccuracyTrendChart/></div>}
        {active === 'modes' && <PracticeModeCard/>}
      </section>
    </main>
    <BottomNav/>
    <style>{'.analytics-stat>div:first-child{display:none!important}.analytics-stat{min-width:0}.analytics-stat span{white-space:normal} [role=tablist]::-webkit-scrollbar{display:none}'}</style>
  </div>
}
