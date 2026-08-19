'use client'

import { useState } from 'react'
import { Inter, Space_Grotesk } from 'next/font/google'
import Divider from '@/components/ui/Divider'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['700'] })

type TimeRange = '7' | '30' | 'all'

interface ModeStats {
  sessions: number
  accuracy: number
  bestScore: string
}

interface ModeData {
  name: string
  icon: string
  color: string
  iconBg: string
  stats: Record<TimeRange, ModeStats>
}

const modes: ModeData[] = [
  {
    name: 'Quick Fire',
    icon: '⚡',
    color: '#facc15',
    iconBg: 'rgba(250,204,21,0.15)',
    stats: {
      '7':   { sessions: 8,  accuracy: 74, bestScore: '18/20'   },
      '30':  { sessions: 28, accuracy: 76, bestScore: '18/20'   },
      'all': { sessions: 54, accuracy: 72, bestScore: '19/20'   },
    },
  },
  {
    name: 'Campaign',
    icon: '🎯',
    color: '#25d6a2',
    iconBg: 'rgba(37,214,162,0.15)',
    stats: {
      '7':   { sessions: 4,  accuracy: 70, bestScore: '65%'     },
      '30':  { sessions: 16, accuracy: 72, bestScore: '68%'     },
      'all': { sessions: 30, accuracy: 69, bestScore: '71%'     },
    },
  },
  {
    name: 'JAMB Simulation',
    icon: '📋',
    color: '#3FB7FF',
    iconBg: 'rgba(63,183,255,0.15)',
    stats: {
      '7':   { sessions: 2,  accuracy: 66, bestScore: '264/400' },
      '30':  { sessions: 6,  accuracy: 68, bestScore: '276/400' },
      'all': { sessions: 11, accuracy: 65, bestScore: '276/400' },
    },
  },
  {
    name: 'Sudden Death',
    icon: '💀',
    color: '#ef4444',
    iconBg: 'rgba(239,68,68,0.15)',
    stats: {
      '7':   { sessions: 3,  accuracy: 59, bestScore: '10/20'   },
      '30':  { sessions: 9,  accuracy: 61, bestScore: '12/20'   },
      'all': { sessions: 17, accuracy: 58, bestScore: '13/20'   },
    },
  },
]

export default function PracticeModeCard({ className = '' }: { className?: string }) {
  const [range, setRange]         = useState<TimeRange>('30')
  const [reviewing, setReviewing] = useState<ModeData | null>(null)

  return (
    <>
       <div
             className={className}
                 style={{ margin: '0 14px',  backgroundColor: '#0d1f35',  border: '1px solid #1a3a5c',  borderRadius: '16px',   padding: '14px',
  }}
>
         
        {/* Header */}
        <div style={{  display: 'flex', alignItems: 'center', justifyContent: 'space-between',  marginBottom: '16px',  }}
           >
          <div style={{  display: 'flex', alignItems: 'center', gap: '8px',  }}
             >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#3FB7FF" strokeWidth={2}>
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#4d6a87]"
              style={{ fontFamily: inter.style.fontFamily }}
            >
              Practice Mode Performance
            </span>
          </div>
          <select value={range} onChange={(e) => setRange(e.target.value as TimeRange)} className="appearance-none"
  style={{ fontFamily: inter.style.fontFamily,  backgroundColor: '#112236', border: '1px solid #1a3a5c', borderRadius: '8px',  padding: '4px 28px 4px 10px', fontSize: '10px',  fontWeight: 600,  color: '#a8c8e8',
    outline: 'none', cursor: 'pointer',backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%234d6a87' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',  backgroundPosition: 'right 6px center',
  }}
>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Mode cards grid */}
        <div style={{  display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '16px',  }}
           >
          {modes.map((mode) => {
            const s = mode.stats[range]
            return (
              <div  key={mode.name}  style={{ backgroundColor: '#112236', border: '1px solid #1a3a5c',  borderRadius: '12px', padding: '14px 12px',   display: 'flex',   flexDirection: 'column',   gap: '10px', }}
>
  
                {/* Mode header */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-[13px] flex-shrink-0"
                    style={{ background: mode.iconBg }}
                  >
                    {mode.icon}
                  </div>
                  <span
                    className="text-[14px] font-bold text-[#e8f4ff] leading-[1.3] min-w-0"
                    style={{ fontFamily: spaceGrotesk.style.fontFamily }}
                  >
                    {mode.name}
                  </span>
                </div>

                {/* Sessions */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] text-[#4d6a87]"
                    style={{ fontFamily: inter.style.fontFamily }}
                  >
                    Sessions
                  </span>
                  <span
                    className="text-[12px] font-semibold text-[#cbd5e1]"
                    style={{ fontFamily: inter.style.fontFamily }}
                  >
                    {s.sessions}
                  </span>
                </div>

                {/* Accuracy */}
                <div>
                  <span
                    className="text-[26px] font-bold leading-none"
                    style={{
                      fontFamily: spaceGrotesk.style.fontFamily,
                      color: mode.color,
                    }}
                  >
                    {s.accuracy}%
                  </span>
                  <p
                    className="text-[11px] text-[#4d6a87] mt-[2px]"
                    style={{ fontFamily: inter.style.fontFamily }}
                  >
                    Accuracy
                  </p>
                </div>

                <Divider />

                {/* Best score */}
                <div className="flex flex-col gap-[2px]">
                  <span
                    className="text-[11px] text-[#4d6a87]"
                    style={{ fontFamily: inter.style.fontFamily }}
                  >
                    Best Score
                  </span>
                  <span
                    className="text-[12px] font-semibold text-[#cbd5e1]"
                    style={{ fontFamily: inter.style.fontFamily }}
                  >
                    {s.bestScore}
                  </span>
                </div>

                {/* Review button */}
                <button  onClick={() => setReviewing(mode)}
                    style={{ width: '100%', padding: '8px 0',   border: 'none', borderRadius: '8px',  fontFamily: spaceGrotesk.style.fontFamily,
                             fontSize: '13px',  fontWeight: 700, backgroundColor: mode.color,  color: mode.color === '#ef4444' ? '#fff' : '#071426',  cursor: 'pointer', transition: 'opacity 0.15s ease',
                           }}
                  >
  Review
</button>

              </div>
            )
          })}
        </div>

        <Divider />

        {/* Footer */}
        <div className="flex items-center justify-between pt-[14px]">
          <span
            className="text-[11px] text-[#475569] leading-[1.4]"
            style={{ fontFamily: inter.style.fontFamily }}
          >
            Tap Review to see session history and missed questions
          </span>
          <span className="text-[#3FB7FF] text-[16px] flex-shrink-0">›</span>
        </div>

      </div>

      {/* Review bottom sheet */}
      {reviewing && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{
            background: '#07142670',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={(e) => e.target === e.currentTarget && setReviewing(null)}
        >
          <div
            className="bg-[#0d1f35] border border-[#1a3a5c] rounded-t-[20px] w-full max-w-[480px] p-[16px_18px_40px]"
            style={{ animation: 'slideUp 0.2s ease' }}
          >
            {/* Handle */}
            <div className="w-8 h-[3px] bg-[#1a3a5c] rounded-full mx-auto mb-4" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center text-[16px]"
                  style={{ background: reviewing.iconBg }}
                >
                  {reviewing.icon}
                </div>
                <span
                  className="text-[17px] font-bold text-[#e8f4ff]"
                  style={{ fontFamily: spaceGrotesk.style.fontFamily }}
                >
                  {reviewing.name}
                </span>
              </div>
              <button
                onClick={() => setReviewing(null)}
                className="w-[26px] h-[26px] rounded-[7px] bg-[#112236] border border-[#1a3a5c] flex items-center justify-center text-[#4d6a87] text-[13px]"
              >
                ✕
              </button>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Sessions',  value: String(reviewing.stats[range].sessions) },
                { label: 'Accuracy',  value: `${reviewing.stats[range].accuracy}%`   },
                { label: 'Best',      value: reviewing.stats[range].bestScore         },
              ].map((s) => (
                <div key={s.label} className="bg-[#112236] rounded-[10px] p-[10px_12px]">
                  <span
                    className="text-[18px] font-bold text-[#e8f4ff] block leading-none mb-[4px]"
                    style={{
                      fontFamily: spaceGrotesk.style.fontFamily,
                      color: reviewing.color,
                    }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="text-[10px] text-[#4d6a87]"
                    style={{ fontFamily: inter.style.fontFamily }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <Divider className="mb-4" />

            {/* Placeholder for session list */}
            <p
              className="text-[12px] text-[#4d6a87] text-center py-6"
              style={{ fontFamily: inter.style.fontFamily }}
            >
              Session history will appear here once data is connected
            </p>

          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
