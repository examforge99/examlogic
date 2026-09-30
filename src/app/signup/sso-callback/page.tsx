'use client'

import { useEffect, useRef } from 'react'
import { useSignIn, useSignUp } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

export default function SignupSSOCallback() {
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const run = async () => {
      try {
        if (signUp.status === 'complete') {
          await signUp.finalize({ navigate: async () => router.replace('/onboarding') })
          return
        }

        if (signIn.status === 'complete') {
          await signIn.finalize({ navigate: async () => router.replace('/dashboard') })
          return
        }

        router.replace('/signup')
      } catch {
        router.replace('/signup?oauth_error=1')
      }
    }

    void run()
  }, [signIn, signUp, router])

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">Exam<span className="auth-brand-accent">Logic</span></div>
        <h1 className="auth-heading">Creating your account…</h1>
        <p className="auth-sub">Completing your Google sign-up securely.</p>
      </div>
    </main>
  )
}
