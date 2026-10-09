'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { dashboardColors as C, dashboardStyles as css } from './styles'

export default function SubscriptionPrompt() {
  const router = useRouter()

  return (
    <section style={{ ...css.panel, background: '#EFEBF8', borderColor: 'rgba(124,91,183,.24)' }}>
      <p style={css.label}>ExamLogic Plus</p>
      <h2 style={{ ...css.title, fontSize: 16 }}>Unlock your first month.</h2>
      <p style={css.sub}>Explore the full preparation experience with your free trial.</p>
      <button onClick={() => router.push('/subscription')} style={{ ...css.action, marginTop: 13, background: '#A78BFA' }}>
        Explore free trial <ArrowRight size={14} />
      </button>
    </section>
  )
}
