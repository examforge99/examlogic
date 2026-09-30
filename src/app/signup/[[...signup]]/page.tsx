'use client'

import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const styles = {
  page: { minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box', background: '#071426', color: '#E8F0F7' } as const,
  shell: { width: '100%', maxWidth: 410 } as const,
  brand: { margin: '0 0 42px', fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 24, fontWeight: 750, letterSpacing: '-.04em' } as const,
  heading: { margin: 0, fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 30, lineHeight: 1.12, fontWeight: 720, letterSpacing: '-.035em' } as const,
  sub: { margin: '10px 0 28px', color: '#9AAABD', fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.5 } as const,
  label: { display: 'block', margin: '0 0 7px', color: '#C7D3DF', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 650 } as const,
  input: { width: '100%', height: 48, boxSizing: 'border-box', padding: '0 14px', border: '1px solid rgba(255,255,255,.10)', borderRadius: 10, outline: 'none', background: '#0D1B2E', color: '#E8F0F7', fontFamily: 'Inter, sans-serif', fontSize: 14 } as const,
  field: { marginBottom: 17 } as const,
  primary: { width: '100%', height: 48, border: 0, borderRadius: 10, background: '#25D6A2', color: '#06141F', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 750, cursor: 'pointer' } as const,
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0', color: '#718399', fontFamily: 'Inter, sans-serif', fontSize: 11 } as const,
  line: { height: 1, flex: 1, background: 'rgba(255,255,255,.08)' } as const,
  google: { width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, background: '#0D1B2E', color: '#E8F0F7', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 650, cursor: 'pointer' } as const,
  bottom: { marginTop: 26, textAlign: 'center' as const, color: '#8999AB', fontFamily: 'Inter, sans-serif', fontSize: 13 } as const,
  link: { color: '#3FB7FF', border: 0, padding: 0, background: 'transparent', font: 'inherit', fontWeight: 700, cursor: 'pointer' } as const,
  error: { margin: '0 0 16px', padding: '11px 12px', borderRadius: 9, border: '1px solid rgba(255,90,90,.20)', background: 'rgba(255,90,90,.07)', color: '#FFB4B4', fontFamily: 'Inter, sans-serif', fontSize: 12, lineHeight: 1.45 } as const,
  verify: { marginTop: 18, padding: 14, borderRadius: 10, border: '1px solid rgba(255,255,255,.08)', background: '#0D1B2E' } as const,
}

function messageFromError(error: any) {
  return error?.errors?.[0]?.longMessage || 'We couldn’t create your account. Please check your details and try again.'
}

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!isLoaded || loading) return
    setError('')
    setLoading(true)
    try {
      await signUp.create({ emailAddress: email, password })
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setLoading(false)
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault()
    if (!isLoaded || loading) return
    setError('')
    setLoading(true)
    try {
      const result = await signUp.attemptEmailAddressVerification({ code })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/onboarding')
      } else {
        setError('Verification is not complete yet. Please check the code and try again.')
      }
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setLoading(false)
    }
  }

  async function google() {
    if (!isLoaded || loading) return
    setError('')
    await signUp.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/signup/sso-callback',
      redirectUrlComplete: '/onboarding',
    })
  }

  return <main style={styles.page}><div style={styles.shell}>
    <div style={styles.brand}>ExamLogic</div>
    <h1 style={styles.heading}>Start your preparation</h1>
    <p style={styles.sub}>Create your account and get started with ExamLogic.</p>
    {error && <div role="alert" style={styles.error}>{error}</div>}
    {!pendingVerification ? <form onSubmit={submit}>
      <div style={styles.field}><label style={styles.label} htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} required /></div>
      <div style={styles.field}><label style={styles.label} htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} required /></div>
      <button type="submit" disabled={!isLoaded || loading} style={{ ...styles.primary, opacity: !isLoaded || loading ? .65 : 1 }}>{loading ? 'Creating account…' : 'Create account'}</button>
    </form> : <form onSubmit={verify}>
      <div style={styles.verify}><label style={styles.label} htmlFor="code">Verification code</label><input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} style={styles.input} required /><button type="submit" disabled={loading} style={{ ...styles.primary, marginTop: 12 }}>{loading ? 'Verifying…' : 'Verify email'}</button></div>
    </form>}
    {!pendingVerification && <><div style={styles.divider}><span style={styles.line} /><span>OR</span><span style={styles.line} /></div><button type="button" style={styles.google} disabled={loading} onClick={google}><span style={{ fontFamily: 'Arial, sans-serif', fontSize: 17, fontWeight: 700 }}>G</span>Continue with Google</button></>}
    <div style={styles.bottom}>Already have an account? <button type="button" style={styles.link} onClick={() => router.push('/login')}>Sign in</button></div>
  </div></main>
}