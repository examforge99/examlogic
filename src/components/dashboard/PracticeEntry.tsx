'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Play } from 'lucide-react'
import { dashboardColors as C, dashboardStyles as css } from './styles'

export default function PracticeEntry() {
  const router = useRouter()

  return (
    <button onClick={() => router.push('/practice')} style={{ ...css.panel, width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', color: C.text, background: '#E0EDF3', borderColor: 'rgba(8,118,184,.24)' }}>
      <span style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 13, background: C.primary, color: '#071426' }}>
        <Play size={19} fill="currentColor" />
      </span>
      <span style={{ flex: 1 }}>
        <strong style={{ display: 'block', fontSize: 15 }}>Start practicing</strong>
        <span style={{ ...css.sub, display: 'block', marginTop: 3 }}>Choose a mode and keep moving.</span>
      </span>
      <ArrowRight size={17} color="#0876B8" />
    </button>
  )
}
