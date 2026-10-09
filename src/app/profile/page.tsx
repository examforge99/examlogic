'use client'

// src/app/profile/page.tsx
import { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Activity, Bookmark, BookOpen, ChevronRight, CircleHelp, FileText, LogOut, UserRound } from 'lucide-react'

const sections = [
  { title: 'YOUR PREPARATION', rows: [
    { label: 'Dashboard', detail: 'Your next action and study time', icon: BookOpen, href: '/dashboard' },
    { label: 'Practice Modes', detail: 'Choose a way to practise', icon: Bookmark, href: '/practice' },
    { label: 'Analytics', detail: 'Explore your progress and consistency', icon: Activity, href: '/analytics' },
    { label: 'Accuracy History', detail: 'Review your question history', icon: FileText, href: '/accuracy-history' },
  ]},
  { title: 'ACCOUNT & SUPPORT', rows: [
    { label: 'Subscription', detail: 'Review your plan options', icon: UserRound, href: '/subscription' },
    { label: 'Help & Support', detail: 'Get guidance using ExamLogic', icon: CircleHelp, href: '/help' },
  ]},
]
export default function ProfilePage() {
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)
  if (!isLoaded) return <main style={{ minHeight: '100svh', background: '#E8E8E5', padding: 20 }}><div style={{ maxWidth: 620, height: 180, margin: '20px auto', borderRadius: 16, background: '#F7F7F3', animation: 'profilePulse 1.2s ease-in-out infinite alternate' }}/><style>{'@keyframes profilePulse{to{opacity:.45}}'}</style></main>

  const name = user?.fullName || user?.firstName || 'Student'
  const initials = name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
  async function logout() { setSigningOut(true); await signOut(); router.push('/auth') }

  return <main style={{ minHeight: '100svh', background: '#E8E8E5', color: '#171A1C', padding: '28px 16px calc(110px + env(safe-area-inset-bottom))' }}>
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <header style={{ marginBottom: 22 }}><p style={{ margin: 0, color: '#25D6A2', fontSize: 10, fontWeight: 800, letterSpacing: '.13em' }}>YOUR SPACE</p><h1 style={{ margin: '7px 0 0', fontSize: 29, letterSpacing: '-.04em' }}>Profile</h1></header>
      <section style={{ textAlign: 'center', padding: '23px 16px', borderRadius: 18, border: '1px solid rgba(23,26,28,.10)', background: 'linear-gradient(145deg,#F7F7F3,#F7F7F3 70%)' }}>
        {user?.imageUrl ? <img src={user.imageUrl} alt="" style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 22, margin: '0 auto 13px', border: '1px solid rgba(63,183,255,.35)' }}/> : <div style={{ width: 68, height: 68, margin: '0 auto 13px', display: 'grid', placeItems: 'center', borderRadius: 22, background: 'linear-gradient(135deg,#3FB7FF,#25D6A2)', color: '#E8E8E5', fontSize: 20, fontWeight: 850 }}>{initials || <UserRound size={24}/>}</div>}
        <h2 style={{ margin: 0, fontSize: 19, letterSpacing: '-.025em' }}>{name}</h2>
        <span style={{ display: 'inline-flex', marginTop: 9, padding: '5px 9px', borderRadius: 7, background: 'rgba(63,183,255,.1)', color: '#3FB7FF', fontSize: 10, fontWeight: 750 }}>EXAMLOGIC STUDENT</span>
      </section>

      <section style={{ marginTop: 22 }}>
        <p style={{ margin: '0 0 10px 2px', color: '#737B83', fontSize: 10, fontWeight: 800, letterSpacing: '.12em' }}>PERFORMANCE SNAPSHOT</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 9 }}>
          {[['STREAK','—','study days'],['AVG. SCORE','—','across sessions'],['TIME SPENT','—','learning time']].map(([label,value,detail]) => <div key={label} style={{ padding: '14px 11px', borderRadius: 13, border: '1px solid rgba(23,26,28,.09)', background: '#F7F7F3', minWidth: 0 }}><p style={{ margin: 0, color: '#737B83', fontSize: 9, fontWeight: 800, letterSpacing: '.06em' }}>{label}</p><p style={{ margin: '12px 0 4px', fontSize: 24, fontWeight: 800, letterSpacing: '-.04em' }}>{value}</p><p style={{ margin: 0, color: '#4B5560', fontSize: 9, lineHeight: 1.4 }}>{detail}</p></div>)}
        </div>
      </section>

      {sections.map(section => <section key={section.title} style={{ marginTop: 25 }}>
        <p style={{ margin: '0 0 9px 2px', color: '#737B83', fontSize: 10, fontWeight: 800, letterSpacing: '.12em' }}>{section.title}</p>
        <div style={{ overflow: 'hidden', border: '1px solid rgba(23,26,28,.10)', borderRadius: 14, background: '#F7F7F3' }}>
          {section.rows.map((item,index) => { const Icon = item.icon; return <button key={item.label} onClick={() => router.push(item.href)} style={{ width: '100%', minHeight: 64, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', color: '#171A1C', borderBottom: index === section.rows.length - 1 ? 0 : '1px solid rgba(23,26,28,.07)' }}>
            <span style={{ width: 34, height: 34, flex: '0 0 34px', display: 'grid', placeItems: 'center', borderRadius: 10, background: 'rgba(63,183,255,.08)', color: '#3FB7FF' }}><Icon size={16}/></span>
            <span style={{ flex: 1, minWidth: 0 }}><strong style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>{item.label}</strong><span style={{ display: 'block', marginTop: 4, color: '#4B5560', fontSize: 10 }}>{item.detail}</span></span><ChevronRight size={16} color="#6F8298"/>
          </button>})}
        </div>
      </section>)}

      
      <button disabled={signingOut} onClick={logout} style={{ width: '100%', marginTop: 10, padding: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 11, background: '#EEEEEB', color: '#171A1C', fontSize: 12, fontWeight: 700, opacity: signingOut ? .6 : 1 }}><LogOut size={15}/>{signingOut ? 'Signing out…' : 'Sign out'}</button>
      <p style={{ marginTop: 22, textAlign: 'center', color: '#737B83', fontSize: 10 }}>ExamLogic · Your preparation, in motion.</p>
    </div>
  </main>
}
