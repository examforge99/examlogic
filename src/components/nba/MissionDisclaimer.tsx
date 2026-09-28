'use client'

export default function MissionDisclaimer({ open }: { open: boolean }) {
  if (!open) return null
  return (
    <div className='reading-transition' role='status' aria-live='polite'>
      <div className='transition-inner'>
        <span className='transition-kicker'>Before you begin</span>
        <strong>Your focus is set.</strong>
        <p>ExamLogic provides the focus and recommended timing, not the learning material. Use your own textbook, notes, tutorial, or preferred study material.</p>
      </div>
    </div>
  )
}
