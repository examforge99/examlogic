'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

function messageFromError(error: any) {
  const code = error?.errors?.[0]?.code
  if (code === 'form_identifier_not_found' || code === 'form_password_incorrect') return 'Email or password is incorrect.'
  return error?.errors?.[0]?.longMessage || 'We couldn’t complete that request. Please try again.'
}

export default function LoginPage() {
  const { signIn } = useSignIn()
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
  const [googleLoading, setGoogleLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { error: createError } = await signIn.password({ identifier: email, password })
      if (createError) throw createError
      if (signIn.status === 'complete') {
        await signIn.finalize()
        router.push('/dashboard')
      } else {
        setError('Additional verification is required. Please continue your sign-in from the verification prompt.')
      }
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setLoading(false)
    }
  }

  async function sendReset(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { error: createError } = await signIn.create({ identifier: email })
      if (createError) throw createError
      const { error: resetError } = await signIn.resetPasswordEmailCode.sendCode()
      if (resetError) throw resetError
      setResetSent(true)
    } catch (err) {
      setError('We couldn’t send a reset code. Check the email and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({ code })
      if (verifyError) throw verifyError
      const { error: passwordError } = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword })
      if (passwordError) throw passwordError
      if (signIn.status === 'complete') {
        await signIn.finalize()
        router.push('/dashboard')
      } else {
        setError('Password reset is not complete yet. Please check the code and try again.')
      }
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setLoading(false)
    }
  }

  async function google() {
    if (loading || googleLoading) return
    setError('')
    setGoogleLoading(true)
    try {
      await signIn.sso({ strategy: 'oauth_google', redirectCallbackUrl: '/login/sso-callback', redirectUrl: '/dashboard' })
    } catch (err) {
      setGoogleLoading(false)
      setError(messageFromError(err))
    }
  }

  if (mode === 'forgot') {
    return (
      <main className="auth-page">
        <div className="auth-shell">
          <div className="auth-brand">Exam<span className="auth-brand-accent">Logic</span></div>
          <h1 className="auth-heading">Reset your password</h1>
          <p className="auth-sub">
            {resetSent
              ? 'Enter the code we sent to your email and choose a new password.'
              : 'Enter the email you use for ExamLogic and we’ll send you a reset code.'}
          </p>

          {error && <div role="alert" className="auth-error">{error}</div>}

          {!resetSent ? (
            <form onSubmit={sendReset}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="auth-primary">
                {loading ? 'Sending code…' : 'Send reset code'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reset-code">Verification code</label>
                <input
                  id="reset-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="new-password">New password</label>
                <div className="auth-password-wrap">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="auth-input auth-input-password"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    className="auth-eye"
                    onClick={() => setShowNewPassword(v => !v)}
                  >
                    {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="auth-primary">
                {loading ? 'Updating password…' : 'Set new password'}
              </button>
            </form>
          )}

          <button
            type="button"
            className="auth-back"
            onClick={() => {
              setMode('login')
              setResetSent(false)
              setCode('')
              setNewPassword('')
              setError('')
            }}
          >
            ← Back to sign in
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">Exam<span className="auth-brand-accent">Logic</span></div>
        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Sign in to continue your preparation.</p>

        {error && <div role="alert" className="auth-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="auth-password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="auth-input auth-input-password"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="auth-eye"
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button type="button" className="auth-forgot" onClick={() => { setMode('forgot'); setError('') }}>
            Forgot password?
          </button>

          <button type="submit" disabled={loading} className="auth-primary">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span>OR</span>
          <span className="auth-divider-line" />
        </div>

        <button type="button" className={`auth-google ${googleLoading ? 'auth-google-loading' : ''}`} disabled={loading || googleLoading} onClick={google}>
          <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.22Z"/>
  <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"/>
  <path fill="#FBBC05" d="M6.54 13.84A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.84V7.63H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.37l3.24-2.53Z"/>
  <path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.83 3.16 14.62 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.38l3.24 2.53C7.31 7.85 9.46 6.13 12 6.13Z"/>
</svg>
          <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
          {googleLoading && <span className="auth-spinner" aria-hidden="true" />}
        </button>

        <div className="auth-bottom">
          Don&apos;t have an account?{' '}
          <button type="button" className="auth-link" onClick={() => router.push('/signup')}>
            Create account
          </button>
        </div>
      </div>
    </main>
  )
}
