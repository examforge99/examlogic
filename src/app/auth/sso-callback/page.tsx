'use client'

import { useEffect, useRef } from 'react'
import { useSignIn, useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

function getPostAuthRedirect() {
  try {
    const requested = new URLSearchParams(window.location.search).get('redirect_url')
    if (!requested) return '/dashboard'
    const destination = new URL(requested, window.location.origin)
    if (destination.origin !== window.location.origin) return '/dashboard'
    if (destination.pathname === '/auth' || destination.pathname.startsWith('/auth/') || destination.pathname === '/onboarding' || destination.pathname.startsWith('/onboarding/')) return '/dashboard'
    return destination.pathname + destination.search + destination.hash
  } catch {
    return '/dashboard'
  }
}

export default function AuthSSOCallback() {
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const run = async () => {
      try {
        if (signIn.status === 'complete') {
          const { error } = await signIn.finalize({
            navigate: ({ decorateUrl }) => {
              const url = decorateUrl(getPostAuthRedirect())
              window.location.href = url
            },
          })
          if (error) throw error
          return
        }

        if (signUp.status === 'complete') {
          const { error } = await signUp.finalize({
            navigate: ({ decorateUrl }) => {
              const destination = getPostAuthRedirect()
              const url = decorateUrl(`/onboarding?redirect_url=${encodeURIComponent(destination)}`)
              window.location.href = url
            },
          })
          if (error) throw error
          return
        }

        router.replace('/auth')
      } catch {
        router.replace('/auth?oauth_error=1')
      }
    }

    void run()
  }, [signIn, signUp, router])

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">Exam<span className="auth-brand-accent">Logic</span></div>
        <h1 className="auth-heading">Connecting securely…</h1>
        <p className="auth-sub">Completing your Google sign-in.</p>
      </div>
    </main>
  )
}
