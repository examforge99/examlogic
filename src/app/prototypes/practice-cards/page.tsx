import type { CSSProperties } from 'react'

type Mode = {
  name: string
  description: string
  state: string
  mark: string
  accent: string
  glow: string
  meta: string[]
}

const modes: Mode[] = [
  { name: 'Quick Fire', description: 'Fast, focused practice to keep your recall sharp.', state: 'Available', mark: '⚡', accent: '#438FEF', glow: 'rgba(67,143,239,.30)', meta: ['20 questions', '15 min'] },
  { name: 'Campaign', description: 'Build your preparation through deliberate practice.', state: 'Unlocked', mark: '◈', accent: '#9276D8', glow: 'rgba(146,118,216,.28)', meta: ['Subject & topic', 'Self-paced'] },
  { name: 'Simulation', description: 'Experience the pressure and rhythm of the real exam.', state: 'Locked', mark: '▣', accent: '#D49A45', glow: 'rgba(212,154,69,.28)', meta: ['180 questions', '2 hours'] },
  { name: 'Sudden Death', description: 'One question. One minute. Keep your focus.', state: 'Locked', mark: '×', accent: '#D45569', glow: 'rgba(212,85,105,.28)', meta: ['1 min / question', 'High pressure'] },
]

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', background: '#071426', color: '#C9D1D9', fontFamily: 'var(--font-inter), system-ui, sans-serif', padding: '32px 18px' },
  wrap: { width: 'min(100%, 900px)', margin: '0 auto' },
  heading: { margin: '0 0 6px', fontSize: '20px', fontWeight: 650, letterSpacing: '-0.025em' },
  sub: { margin: '0 0 24px', color: '#8D99A6', fontSize: '13px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' },
  card: { position: 'relative', minHeight: '190px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.09)', borderRadius: '20px', background: '#0A1A2B', padding: '22px', boxShadow: '0 18px 42px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.035)' },
  glow: { position: 'absolute', left: '-10%', top: '-35%', width: '75%', height: '150px', borderRadius: '50%', filter: 'blur(28px)', opacity: 0.55, pointerEvents: 'none', transform: 'rotate(-8deg)' },
  top: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' },
  mark: { width: '34px', height: '34px', borderRadius: '10px', display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,.09)', fontSize: '15px', fontWeight: 700 },
  state: { fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6F7B87' },
  title: { position: 'relative', margin: '24px 0 7px', fontSize: '18px', letterSpacing: '-.02em', fontWeight: 650 },
  description: { position: 'relative', margin: 0, color: '#8D99A6', fontSize: '12.5px', lineHeight: 1.5, maxWidth: '290px' },
  meta: { position: 'relative', display: 'flex', gap: '16px', marginTop: '22px', color: '#AAB4BE', fontSize: '11px' },
}

export default function PracticeCardsPrototype() {
  return (
    <main style={styles.page}>
      <style>{'@media (max-width: 650px) { .practice-card-grid { grid-template-columns: 1fr !important; } }'}</style>
      <div style={styles.wrap}>
        <h1 style={styles.heading}>Practice</h1>
        <p style={styles.sub}>Choose how you want to practice.</p>
        <section className="practice-card-grid" style={styles.grid}>
          {modes.map((mode) => (
            <article key={mode.name} style={styles.card}>
              <div aria-hidden="true" style={{ ...styles.glow, background: 'linear-gradient(90deg, ' + mode.glow + ', transparent)' }} />
              <div style={styles.top}>
                <div style={{ ...styles.mark, background: 'linear-gradient(145deg, ' + mode.glow + ', rgba(255,255,255,.025))', color: mode.accent }}>{mode.mark}</div>
                <span style={styles.state}>{mode.state}</span>
              </div>
              <h2 style={styles.title}>{mode.name}</h2>
              <p style={styles.description}>{mode.description}</p>
              <div style={styles.meta}>
                {mode.meta.map((item, index) => (
                  <span key={item} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {index > 0 && <span aria-hidden="true" style={{ width: '4px', height: '4px', borderRadius: '50%', background: mode.accent, opacity: 0.7 }} />}
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
