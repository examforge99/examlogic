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
              <span className="auth-google-mark">G</span>
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
