'use client'

import { useEffect, useRef } from 'react'
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function LoginSSOCallback() {
  const clerk = useClerk()
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
          await signIn.finalize({ navigate: async () => router.replace('/dashboard') })
          return
        }

        if (signUp.status === 'complete') {
          await signUp.finalize({ navigate: async () => router.replace('/onboarding') })
          return
        }

        router.replace('/login')
      } catch {
        router.replace('/login?oauth_error=1')
      }
    }

    void run()
  }, [clerk, signIn, signUp, router])

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">Exam<span className="auth-brand-accent">Logic</span></div>
        <h1 className="auth-heading">Signing you in…</h1>
        <p className="auth-sub">Completing your Google sign-in securely.</p>
      </div>
    </main>
  )
}
