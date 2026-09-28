'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

export default function MissionDisclaimer({ open }: { open: boolean }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!open || !mounted) return null
  return createPortal((
    <div className='reading-transition' role='status' aria-live='polite'>
      <div className='transition-inner'>
        <span className='transition-kicker'>Before you begin</span>
        <strong>Your focus is set.</strong>
        <p>ExamLogic provides the focus and recommended timing, not the learning material. Use your own textbook, notes, tutorial, or preferred study material.</p>
      </div>
    </div>
  ), document.body)
}
