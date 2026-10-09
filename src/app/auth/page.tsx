'use client'

import { useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/nextjs'
import { isClerkAPIResponseError } from '@clerk/nextjs/errors'
import { useRouter } from 'next/navigation'

const googleIcon = (
  <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.23a4.47 4.47 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.92-4.2 2.92-7.22Z"/>
    <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z"/>
    <path fill="#FBBC05" d="M6.54 13.84A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.84V7.63H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.37l3.24-2.53Z"/>
    <path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.83 3.16 14.62 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.38l3.24 2.53C7.31 7.85 9.46 6.13 12 6.13Z"/>
  </svg>
)

function getPostAuthRedirect() {
  try {
    const requested = new URLSearchParams(window.location.search).get('redirect_url')
    if (!requested) return '/dashboard'
    const destination = new URL(requested, window.location.origin)
    if (destination.origin !== window.location.origin) return '/dashboard'
    if (destination.pathname === '/auth' || destination.pathname.startsWith('/auth/')) return '/dashboard'
    return destination.pathname + destination.search + destination.hash
  } catch {
    return '/dashboard'
  }
}

export default function AuthPage() {
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'choice' | 'email' | 'code'>('choice')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  async function continueWithGoogle() {
    if (loading || googleLoading) return
    setError('')
    setGoogleLoading(true)

    try {
      const { error } = await signIn.sso({
        strategy: 'oauth_google',
        redirectCallbackUrl: '/auth/sso-callback',
        redirectUrl: getPostAuthRedirect(),
      })

      if (error) throw error
    } catch (err) {
      setGoogleLoading(false)
      setError(err instanceof Error ? err.message : 'We couldn’t connect to Google. Please try again.')
    }
  }

  async function sendEmailCode(event: React.FormEvent) {
    event.preventDefault()
    if (loading || !email.trim()) return

    setError('')
    setLoading(true)

    try {
      const { error: createError } = await signIn.create({
        identifier: email.trim(),
        signUpIfMissing: true,
      })

      if (createError) throw createError

      const { error: codeError } = await signIn.emailCode.sendCode()
      if (codeError) throw codeError

      setStep('code')
    } catch (err) {
      setError(
        isClerkAPIResponseError(err)
          ? err.errors[0]?.longMessage || 'We couldn’t send your verification code.'
          : 'We couldn’t send your verification code. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function verifyEmailCode(event: React.FormEvent) {
    event.preventDefault()
    if (loading || !code.trim()) return

    setError('')
    setLoading(true)

    try {
      const { error: verifyError } = await signIn.emailCode.verifyCode({ code: code.trim() })

      if (verifyError) {
        if (
          isClerkAPIResponseError(verifyError) &&
          verifyError.errors[0]?.code === 'sign_up_if_missing_transfer'
        ) {
          const { error: transferError } = await signUp.create({ transfer: true })
          if (transferError) throw transferError

          if (signUp.status === 'complete') {
            await signUp.finalize({
              navigate: ({ decorateUrl }) => {
                const url = decorateUrl(getPostAuthRedirect())
                if (url.startsWith('http')) window.location.href = url
                else router.push(url)
              },
            })
            return
          }

          setError('Your account needs a little more information before we can continue.')
          return
        }

        throw verifyError
      }

      if (signIn.status === 'complete') {
        await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl(getPostAuthRedirect())
            if (url.startsWith('http')) window.location.href = url
            else router.push(url)
          },
        })
        return
      }

      setError('Your verification needs another step. Please try again.')
    } catch (err) {
      setError(
        isClerkAPIResponseError(err)
          ? err.errors[0]?.longMessage || 'That code isn’t valid. Please try again.'
          : 'We couldn’t verify that code. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  function startOver() {
    signIn.reset()
    setEmail('')
    setCode('')
    setError('')
    setStep('choice')
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">Exam<span className="auth-brand-accent">Logic</span></div>

        {step === 'choice' && (
          <>
            <h1 className="auth-heading">Welcome to ExamLogic</h1>
            <p className="auth-sub">Your preparation starts here.</p>

            {error && <div role="alert" className="auth-error">{error}</div>}

            <button
              type="button"
              className={`auth-google ${googleLoading ? 'auth-google-loading' : ''}`}
              disabled={googleLoading}
              onClick={continueWithGoogle}
            >
              {googleIcon}
              <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
              {googleLoading && <span className="auth-spinner" aria-hidden="true" />}
            </button>

            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span>OR</span>
              <span className="auth-divider-line" />
            </div>

            <button type="button" className="auth-primary" onClick={() => { setError(''); setStep('email') }}>
              Continue with email
            </button>
          </>
        )}

        {step === 'email' && (
          <>
            <h1 className="auth-heading">Enter your email</h1>
            <p className="auth-sub">We’ll send you a verification code to continue.</p>

            {error && <div role="alert" className="auth-error">{error}</div>}

            <form onSubmit={sendEmailCode}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-email">Email</label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="auth-input"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading} className="auth-primary">
                {loading ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>

            <button type="button" className="auth-back" onClick={startOver}>
              ← Back
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <h1 className="auth-heading">Check your email</h1>
            <p className="auth-sub">We sent a verification code to {email}.</p>

            {error && <div role="alert" className="auth-error">{error}</div>}

            <form onSubmit={verifyEmailCode}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="auth-code">Verification code</label>
                <input
                  id="auth-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="auth-input"
                  placeholder="Enter your code"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" disabled={loading} className="auth-primary">
                {loading ? 'Verifying…' : 'Verify and continue'}
              </button>
            </form>

            <button type="button" className="auth-back" onClick={startOver}>
              Use a different email
            </button>
          </>
        )}

        <div id="clerk-captcha" />
      </div>
    </main>
  )
}
