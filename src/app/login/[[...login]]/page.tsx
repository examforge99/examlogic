'use client'

import { useState } from 'react'
import { useSignIn, useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

const styles = {
  page: { minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box', background: '#071426', color: '#E8F0F7' } as const,
  shell: { width: '100%', maxWidth: 410 } as const,
  brand: { margin: '0 0 42px', fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 24, fontWeight: 750, letterSpacing: '-.04em' } as const,
  heading: { margin: 0, fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 30, lineHeight: 1.12, fontWeight: 720, letterSpacing: '-.035em' } as const,
  sub: { margin: '10px 0 28px', color: '#9AAABD', fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.5 } as const,
  label: { display: 'block', margin: '0 0 7px', color: '#C7D3DF', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 650 } as const,
  input: { width: '100%', height: 48, boxSizing: 'border-box', padding: '0 14px', border: '1px solid rgba(255,255,255,.10)', borderRadius: 10, outline: 'none', background: '#0D1B2E', color: '#E8F0F7', fontFamily: 'Inter, sans-serif', fontSize: 14 } as const,
  field: { marginBottom: 17 } as const,
  passwordWrap: { position: 'relative' } as const,
  passwordInput: { paddingRight: 46 } as const,
  eye: { position: 'absolute', right: 12, top: 0, height: 48, width: 32, display: 'grid', placeItems: 'center', padding: 0, border: 0, background: 'transparent', color: '#7F91A6', cursor: 'pointer' } as const,
  primary: { width: '100%', height: 48, border: 0, borderRadius: 10, background: '#25D6A2', color: '#06141F', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 750, cursor: 'pointer' } as const,
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0', color: '#718399', fontFamily: 'Inter, sans-serif', fontSize: 11 } as const,
  line: { height: 1, flex: 1, background: 'rgba(255,255,255,.08)' } as const,
  google: { width: '100%', height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, background: '#0D1B2E', color: '#E8F0F7', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 650, cursor: 'pointer' } as const,
  googleMark: { fontFamily: 'Arial, sans-serif', fontSize: 17, fontWeight: 700 } as const,
  bottom: { marginTop: 26, textAlign: 'center' as const, color: '#8999AB', fontFamily: 'Inter, sans-serif', fontSize: 13 } as const,
  link: { color: '#3FB7FF', border: 0, padding: 0, background: 'transparent', font: 'inherit', fontWeight: 700, cursor: 'pointer' } as const,
  error: { margin: '0 0 16px', padding: '11px 12px', borderRadius: 9, border: '1px solid rgba(255,90,90,.20)', background: 'rgba(255,90,90,.07)', color: '#FFB4B4', fontFamily: 'Inter, sans-serif', fontSize: 12, lineHeight: 1.45 } as const,
  forgot: { display: 'block', margin: '-5px 0 18px', textAlign: 'right' as const, color: '#3FB7FF', border: 0, padding: 0, background: 'transparent', font: 'inherit', fontSize: 12, cursor: 'pointer' } as const,
  back: { display: 'block', margin: '22px auto 0', color: '#8999AB', border: 0, padding: 0, background: 'transparent', font: 'inherit', fontSize: 13, cursor: 'pointer' } as const,
}

function messageFromError(error: any) {
  const code = error?.errors?.[0]?.code
  if (code === 'form_identifier_not_found' || code === 'form_password_incorrect') return 'Email or password is incorrect.'
  return error?.errors?.[0]?.longMessage || 'We couldn’t complete that request. Please try again.'
}

export default function LoginPage() {
  const { signIn } = useSignIn()
  const { setActive } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else {
        setError('Additional verification is required. Please continue your sign-in from the verification prompt.')
      }
    } catch (err) {
      setError(messageFromError(err))
    } finally { setLoading(false) }
  }

  async function sendReset(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email })
      setResetSent(true)
    } catch (err) {
      setError('We couldn’t send a reset code. Check the email and try again.')
    } finally { setLoading(false) }
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code, password: newPassword })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else {
        setError('Password reset is not complete yet. Please check the code and try again.')
      }
    } catch (err) {
      setError(messageFromError(err))
    } finally { setLoading(false) }
  }

  async function google() {
    if (loading) return
    setError('')
    await signIn.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: '/login/sso-callback', redirectUrlComplete: '/dashboard' })
  }

  if (mode === 'forgot') return <main style={styles.page}><div style={styles.shell}>
    <div style={styles.brand}>ExamLogic</div>
    <h1 style={styles.heading}>Reset your password</h1>
    <p style={styles.sub}>{resetSent ? 'Enter the code we sent to your email and choose a new password.' : 'Enter the email you use for ExamLogic and we’ll send you a reset code.'}</p>
    {error && <div role="alert" style={styles.error}>{error}</div>}
    {!resetSent ? <form onSubmit={sendReset}>
      <div style={styles.field}><label style={styles.label} htmlFor="reset-email">Email</label><input id="reset-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} required /></div>
      <button type="submit" disabled={loading} style={{ ...styles.primary, opacity: loading ? .65 : 1 }}>{loading ? 'Sending code…' : 'Send reset code'}</button>
    </form> : <form onSubmit={resetPassword}>
      <div style={styles.field}><label style={styles.label} htmlFor="reset-code">Verification code</label><input id="reset-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} style={styles.input} required /></div>
      <div style={styles.field}><label style={styles.label} htmlFor="new-password">New password</label><div style={styles.passwordWrap}><input id="new-password" type={showNewPassword ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ ...styles.input, ...styles.passwordInput }} required /><button type="button" aria-label={showNewPassword ? 'Hide password' : 'Show password'} style={styles.eye} onClick={() => setShowNewPassword(v => !v)}>{showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
      <button type="submit" disabled={loading} style={{ ...styles.primary, opacity: loading ? .65 : 1 }}>{loading ? 'Updating password…' : 'Set new password'}</button>
    </form>}
    <button type="button" style={styles.back} onClick={() => { setMode('login'); setResetSent(false); setCode(''); setNewPassword(''); setError('') }}>← Back to sign in</button>
  </div></main>

  return <main style={styles.page}><div style={styles.shell}>
    <div style={styles.brand}>ExamLogic</div>
    <h1 style={styles.heading}>Welcome back</h1>
    <p style={styles.sub}>Sign in to continue your preparation.</p>
    {error && <div role="alert" style={styles.error}>{error}</div>}
    <form onSubmit={submit}>
      <div style={styles.field}><label style={styles.label} htmlFor="email">Email</label><input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={styles.input} required /></div>
      <div style={styles.field}><label style={styles.label} htmlFor="password">Password</label><div style={styles.passwordWrap}><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...styles.input, ...styles.passwordInput }} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} style={styles.eye} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
      <button type="button" style={styles.forgot} onClick={() => { setMode('forgot'); setError('') }}>Forgot password?</button>
      <button type="submit" disabled={loading} style={{ ...styles.primary, opacity: loading ? .65 : 1 }}>{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <div style={styles.divider}><span style={styles.line} /><span>OR</span><span style={styles.line} /></div>
    <button type="button" style={styles.google} disabled={loading} onClick={google}><span style={styles.googleMark}>G</span>Continue with Google</button>
    <div style={styles.bottom}>Don't have an account? <button type="button" style={styles.link} onClick={() => router.push('/signup')}>Create account</button></div>
  </div></main>
}