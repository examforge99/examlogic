'use client'

import { useState } from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

function messageFromError(error: any) {
  return error?.errors?.[0]?.longMessage || 'We couldn’t create your account. Please check your details and try again.'
}

export default function SignUpPage() {
  const { signUp } = useSignUp()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { error: createError } = await signUp.password({ emailAddress: email, password })
      if (createError) throw createError
      const { error: verificationError } = await signUp.verifications.sendEmailCode()
      if (verificationError) throw verificationError
      setPendingVerification(true)
    } catch (err) {
      setError(messageFromError(err))
    } finally {
      setLoading(false)
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code })
      if (verifyError) throw verifyError
      if (signUp.status === 'complete') {
        await signUp.finalize()
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
    if (loading) return
    setError('')
    await signUp.sso({ strategy: 'oauth_google', redirectCallbackUrl: '/signup/sso-callback', redirectUrl: '/onboarding' })
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">Exam<span className="auth-brand-accent">Logic</span></div>
        <h1 className="auth-heading">Start your preparation</h1>
        <p className="auth-sub">Create your account and get started with ExamLogic.</p>

        {error && <div role="alert" className="auth-error">{error}</div>}

        {!pendingVerification ? (
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
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="auth-primary">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        ) : (
          <form onSubmit={verify}>
            <div className="auth-verify">
              <label className="auth-label" htmlFor="code">Verification code</label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="auth-input"
                required
              />
              <button type="submit" disabled={loading} className="auth-primary">
                {loading ? 'Verifying…' : 'Verify email'}
              </button>
            </div>
          </form>
        )}

        {!pendingVerification && (
          <>
            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span>OR</span>
              <span className="auth-divider-line" />
            </div>

            <button type="button" className="auth-google" disabled={loading} onClick={google}>
              <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.22Z"/>
  <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"/>
  <path fill="#FBBC05" d="M6.54 13.84A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.84V7.63H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.37l3.24-2.53Z"/>
  <path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.83 3.16 14.62 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.38l3.24 2.53C7.31 7.85 9.46 6.13 12 6.13Z"/>
</svg>
              Continue with Google
            </button>
          </>
        )}

        <div className="auth-bottom">
          Already have an account?{' '}
          <button type="button" className="auth-link" onClick={() => router.push('/login')}>
            Sign in
          </button>
        </div>
      </div>
    </main>
  )
}
