'use client'

import { useId, useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'

const styles = {
  wrap: { marginTop: 18, borderTop: '1px solid rgba(232,240,247,.10)' } as const,
  button: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', minHeight: 44, padding: '10px 0 6px', border: 0, background: 'transparent', color: 'rgba(232,240,247,.68)', fontSize: 12, fontWeight: 700, textAlign: 'left', cursor: 'pointer' } as const,
  label: { display: 'flex', alignItems: 'center', gap: 7 } as const,
  icon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' } as const,
  body: { padding: '5px 0 2px', color: 'rgba(232,240,247,.72)', fontSize: 12, lineHeight: 1.6 } as const,
}

export default function MissionDisclaimer() {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <div style={styles.wrap}>
      <button
        type='button'
        style={styles.button}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(value => !value)}
      >
        <span style={styles.label}><span style={styles.icon}><Info size={15} /></span>About your study material</span>
        <ChevronDown size={17} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .16s ease' }} aria-hidden='true' />
      </button>
      {open && (
        <div id={id} style={styles.body}>
          ExamLogic gives the focus and timing, not the material. Use your own textbook or notes.
        </div>
      )}
      <style>{`
        button:focus-visible { outline: 3px solid rgba(63,183,255,.45); outline-offset: 2px; border-radius: 6px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>
    </div>
  )
}
