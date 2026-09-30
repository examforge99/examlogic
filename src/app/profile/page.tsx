'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { LogOut, Mail, Shield, ChevronRight, UserRound } from 'lucide-react'

export default function ProfilePage() {
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  if (!isLoaded) return <main style={styles.page}><div style={styles.shell}><div style={styles.skeleton} /></div></main>

  const name = user?.fullName || user?.firstName || 'Student'
  const email = user?.primaryEmailAddress?.emailAddress || 'No email available'
  const initials = name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <p style={styles.eyebrow}>ACCOUNT</p>
          <h1 style={styles.title}>Profile</h1>
        </header>

        <section style={styles.identity}>
          <div style={styles.avatar}>{initials || <UserRound size={24} />}</div>
          <div style={styles.identityText}>
            <h2 style={styles.name}>{name}</h2>
            <p style={styles.email}>{email}</p>
          </div>
        </section>

        <section style={styles.section}>
          <p style={styles.sectionLabel}>ACCOUNT</p>
          <div style={styles.card}>
            <div style={styles.row}>
              <div style={styles.icon}><Mail size={18} /></div>
              <div style={styles.rowText}>
                <span style={styles.rowTitle}>Email</span>
                <span style={styles.rowValue}>{email}</span>
              </div>
            </div>
            <div style={styles.separator} />
            <button type="button" style={styles.actionRow} onClick={() => router.push('/login')}>
              <div style={styles.icon}><Shield size={18} /></div>
              <div style={styles.rowText}>
                <span style={styles.rowTitle}>Security</span>
                <span style={styles.rowValue}>Password and sign-in methods</span>
              </div>
              <ChevronRight size={18} style={styles.chevron} />
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <p style={styles.sectionLabel}>PREPARATION</p>
          <div style={styles.card}>
            <button type="button" style={styles.actionRow} onClick={() => router.push('/subjects')}>
              <div style={styles.icon}><UserRound size={18} /></div>
              <div style={styles.rowText}>
                <span style={styles.rowTitle}>Subjects</span>
                <span style={styles.rowValue}>View your selected subjects</span>
              </div>
              <ChevronRight size={18} style={styles.chevron} />
            </button>
          </div>
        </section>

        <button type="button" style={styles.signOut} onClick={handleSignOut}>
          <LogOut size={18} />
          Sign out
        </button>
        <p style={styles.footer}>ExamLogic</p>
      </div>
    </main>
  )
}

const styles = {
  page: { minHeight: '100svh', boxSizing: 'border-box', padding: '28px 18px 110px', background: '#071426', color: '#E8F0F7' } as const,
  shell: { width: '100%', maxWidth: 720, margin: '0 auto' } as const,
  header: { marginBottom: 24 } as const,
  eyebrow: { margin: 0, color: '#25D6A2', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '.14em' } as const,
  title: { margin: '5px 0 0', fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 30, lineHeight: 1.1, letterSpacing: '-.035em' } as const,
  identity: { display: 'flex', alignItems: 'center', gap: 15, padding: 20, border: '1px solid rgba(255,255,255,.08)', borderRadius: 16, background: '#0D1B2E', boxShadow: '0 12px 30px rgba(0,0,0,.16)' } as const,
  avatar: { width: 58, height: 58, flex: '0 0 58px', display: 'grid', placeItems: 'center', borderRadius: 17, background: 'linear-gradient(135deg, #3FB7FF, #25D6A2)', color: '#071426', fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 19, fontWeight: 800 } as const,
  identityText: { minWidth: 0 } as const,
  name: { margin: 0, fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 19, fontWeight: 700 } as const,
  email: { margin: '5px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: '#8FA2B7', fontFamily: 'Inter, sans-serif', fontSize: 13 } as const,
  section: { marginTop: 28 } as const,
  sectionLabel: { margin: '0 0 9px 3px', color: '#6F8298', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 700, letterSpacing: '.12em' } as const,
  card: { overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, background: '#0D1B2E' } as const,
  row: { display: 'flex', alignItems: 'center', gap: 13, padding: 16 } as const,
  actionRow: { width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: 16, border: 0, background: 'transparent', color: 'inherit', textAlign: 'left' as const, cursor: 'pointer' } as const,
  icon: { width: 36, height: 36, flex: '0 0 36px', display: 'grid', placeItems: 'center', borderRadius: 10, background: 'rgba(63,183,255,.08)', color: '#3FB7FF' } as const,
  rowText: { minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 3 } as const,
  rowTitle: { color: '#DDE7F0', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 650 } as const,
  rowValue: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: '#7F91A6', fontFamily: 'Inter, sans-serif', fontSize: 11 } as const,
  separator: { height: 1, margin: '0 16px', background: 'rgba(255,255,255,.06)' } as const,
  chevron: { color: '#5D7086', flex: '0 0 auto' } as const,
  signOut: { width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 32, border: '1px solid rgba(255,100,100,.18)', borderRadius: 11, background: 'rgba(255,100,100,.05)', color: '#FF9D9D', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' } as const,
  footer: { margin: '22px 0 0', textAlign: 'center' as const, color: '#42566D', fontFamily: 'Inter, sans-serif', fontSize: 11 } as const,
  skeleton: { width: '100%', height: 240, borderRadius: 16, background: '#0D1B2E', opacity: .7 } as const,
}
