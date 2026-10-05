'use client'

import { useState } from 'react'


type TimeRange = '7' | '30' | 'all'
interface ModeStats { sessions: number; accuracy: number; bestScore: string }
interface ModeData { name: string; color: string; stats: Record<TimeRange, ModeStats> }

const modes: ModeData[] = [
  { name: 'Quick Fire', color: '#facc15', stats: { '7': { sessions: 8, accuracy: 74, bestScore: '18/20' }, '30': { sessions: 28, accuracy: 76, bestScore: '18/20' }, all: { sessions: 54, accuracy: 72, bestScore: '19/20' } } },
  { name: 'Campaign', color: '#25d6a2', stats: { '7': { sessions: 4, accuracy: 70, bestScore: '65%' }, '30': { sessions: 16, accuracy: 72, bestScore: '68%' }, all: { sessions: 30, accuracy: 69, bestScore: '71%' } } },
  { name: 'JAMB Simulation', color: '#3FB7FF', stats: { '7': { sessions: 2, accuracy: 66, bestScore: '264/400' }, '30': { sessions: 6, accuracy: 68, bestScore: '276/400' }, all: { sessions: 11, accuracy: 65, bestScore: '276/400' } } },
  { name: 'Sudden Death', color: '#ef4444', stats: { '7': { sessions: 3, accuracy: 59, bestScore: '10/20' }, '30': { sessions: 9, accuracy: 61, bestScore: '12/20' }, all: { sessions: 17, accuracy: 58, bestScore: '13/20' } } },
]

export default function PracticeModeCard() {
  const [range, setRange] = useState<TimeRange>('30')

  return (
    <section style={{ width: '100%', color: '#E8F0F7' }} aria-labelledby="practice-modes-title">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <h2 id="practice-modes-title" style={{ margin: 0, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontSize: 16, fontWeight: 700, letterSpacing: '-.025em' }}>Practice modes</h2>
          <p style={{ margin: '4px 0 0', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontSize: 10, color: 'rgba(232,240,247,.42)' }}>Compare how you perform in each mode.</p>
        </div>
        <select value={range} onChange={e => setRange(e.target.value as TimeRange)} aria-label="Practice mode period" style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', background: '#112236', border: '1px solid #1a3a5c', borderRadius: 8, padding: '5px 8px', fontSize: 10, fontWeight: 600, color: '#a8c8e8', outline: 'none' }}>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="all">All time</option>
        </select>
      </div>
      <div style={{ borderTop: '1px solid rgba(232,240,247,.07)' }}>
        {modes.map((mode, index) => {
          const stats = mode.stats[range]
          return (
            <div key={mode.name} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: index < modes.length - 1 ? '1px solid rgba(232,240,247,.055)' : '0' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontSize: 13, fontWeight: 700, color: '#dfeaf1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mode.name}</div>
                <div style={{ marginTop: 4, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontSize: 9, color: 'rgba(232,240,247,.4)' }}>{stats.sessions} sessions · Best {stats.bestScore}</div>
              </div>
              <strong style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: 18, fontWeight: 700, color: mode.color }}>{stats.accuracy}%</strong>
              <span aria-hidden="true" style={{ fontSize: 17, color: '#3FB7FF' }}>›</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
