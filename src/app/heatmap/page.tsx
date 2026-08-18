'use client'

import { useState } from 'react'
import { Inter, Space_Grotesk } from 'next/font/google'
import ProgressBar from '@/components/ui/ProgressBar'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['700'] })

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface DayActivity {
  qs: number
  mins: number
}

interface MonthData {
  name: string
  year: number
  days: number
  startDay: number
  today: number
  activity: Record<number, DayActivity>
}

type MonthKey = '2025-3' | '2025-4' | '2025-5' | '2025-6'

interface PopupState {
  date: number
  dayIdx: number
  activity: DayActivity
  maxQs: number
  monthName: string
}

const defaultData: Record<MonthKey, MonthData> = {
  '2025-6': {
    name: 'July', year: 2025, days: 31, startDay: 1, today: 27,
    activity: {
      1:{qs:0,mins:0},   2:{qs:45,mins:38}, 3:{qs:30,mins:25},
      4:{qs:60,mins:52}, 5:{qs:0,mins:0},   6:{qs:75,mins:65},
      7:{qs:50,mins:42}, 8:{qs:40,mins:35}, 9:{qs:60,mins:50},
      10:{qs:0,mins:0},  11:{qs:55,mins:48},12:{qs:35,mins:30},
      13:{qs:80,mins:70},14:{qs:65,mins:55},15:{qs:0,mins:0},
      16:{qs:50,mins:44},17:{qs:40,mins:34},18:{qs:70,mins:60},
      19:{qs:95,mins:85},20:{qs:55,mins:47},21:{qs:45,mins:38},
      22:{qs:0,mins:0},  23:{qs:60,mins:52},24:{qs:50,mins:43},
      25:{qs:80,mins:68},26:{qs:75,mins:64},27:{qs:40,mins:34},
      28:{qs:0,mins:0},  29:{qs:0,mins:0},  30:{qs:0,mins:0},
      31:{qs:0,mins:0},
    },
  },
  '2025-5': {
    name: 'June', year: 2025, days: 30, startDay: 6, today: 30,
    activity: {
      1:{qs:50,mins:42}, 2:{qs:40,mins:35}, 3:{qs:0,mins:0},
      4:{qs:60,mins:52}, 5:{qs:55,mins:47}, 6:{qs:70,mins:60},
      7:{qs:45,mins:38}, 8:{qs:0,mins:0},   9:{qs:65,mins:55},
      10:{qs:50,mins:43},11:{qs:75,mins:64},12:{qs:60,mins:52},
      13:{qs:0,mins:0},  14:{qs:55,mins:47},15:{qs:40,mins:34},
      16:{qs:80,mins:68},17:{qs:70,mins:60},18:{qs:0,mins:0},
      19:{qs:45,mins:38},20:{qs:55,mins:47},21:{qs:65,mins:55},
      22:{qs:90,mins:78},23:{qs:0,mins:0},  24:{qs:50,mins:43},
      25:{qs:60,mins:52},26:{qs:75,mins:64},27:{qs:55,mins:47},
      28:{qs:0,mins:0},  29:{qs:70,mins:60},30:{qs:65,mins:55},
    },
  },
  '2025-4': {
    name: 'May', year: 2025, days: 31, startDay: 3, today: 31,
    activity: {
      1:{qs:40,mins:34}, 2:{qs:55,mins:47}, 3:{qs:0,mins:0},
      4:{qs:60,mins:52}, 5:{qs:50,mins:43}, 6:{qs:45,mins:38},
      7:{qs:70,mins:60}, 8:{qs:0,mins:0},   9:{qs:55,mins:47},
      10:{qs:65,mins:55},11:{qs:75,mins:64},12:{qs:0,mins:0},
      13:{qs:50,mins:43},14:{qs:60,mins:52},15:{qs:45,mins:38},
      16:{qs:80,mins:68},17:{qs:0,mins:0},  18:{qs:55,mins:47},
      19:{qs:70,mins:60},20:{qs:65,mins:55},21:{qs:0,mins:0},
      22:{qs:75,mins:64},23:{qs:60,mins:52},24:{qs:50,mins:43},
      25:{qs:0,mins:0},  26:{qs:85,mins:72},27:{qs:70,mins:60},
      28:{qs:55,mins:47},29:{qs:0,mins:0},  30:{qs:60,mins:52},
      31:{qs:45,mins:38},
    },
  },
  '2025-3': {
    name: 'April', year: 2025, days: 30, startDay: 1, today: 30,
    activity: {
      1:{qs:35,mins:30}, 2:{qs:50,mins:43}, 3:{qs:60,mins:52},
      4:{qs:0,mins:0},   5:{qs:45,mins:38}, 6:{qs:55,mins:47},
      7:{qs:70,mins:60}, 8:{qs:0,mins:0},   9:{qs:40,mins:34},
      10:{qs:65,mins:55},11:{qs:50,mins:43},12:{qs:0,mins:0},
      13:{qs:60,mins:52},14:{qs:75,mins:64},15:{qs:55,mins:47},
      16:{qs:0,mins:0},  17:{qs:45,mins:38},18:{qs:70,mins:60},
      19:{qs:60,mins:52},20:{qs:0,mins:0},  21:{qs:55,mins:47},
      22:{qs:65,mins:55},23:{qs:80,mins:68},24:{qs:0,mins:0},
      25:{qs:50,mins:43},26:{qs:60,mins:52},27:{qs:45,mins:38},
      28:{qs:0,mins:0},  29:{qs:70,mins:60},30:{qs:55,mins:47},
    },
  },
}

function getLevel(qs: number) {
  if (qs === 0)  return 0
  if (qs <= 20)  return 1
  if (qs <= 45)  return 2
  if (qs <= 70)  return 3
  return 4
}

function getDegree(qs: number) {
  if (qs === 0)  return { label: 'No Activity', color: '#4d6a87', bg: '#112236' }
  if (qs <= 20)  return { label: 'Low',         color: '#25d6a2', bg: '#25d6a215' }
  if (qs <= 45)  return { label: 'Medium',      color: '#25d6a2', bg: '#25d6a230' }
  if (qs <= 70)  return { label: 'High',        color: '#25d6a2', bg: '#25d6a250' }
  return           { label: 'Peak 🔥',        color: '#071426', bg: '#25d6a2'   }
}

function formatTime(mins: number) {
  if (mins === 0) return '—'
  if (mins < 60)  return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function computeStreaks(activity: Record<number, DayActivity>, today: number) {
  let currentStreak = 0
  for (let d = today; d >= 1; d--) {
    if ((activity[d]?.qs ?? 0) > 0) currentStreak++
    else break
  }

  let bestStreak = 0
  let running = 0
  let foundBreak = false
  for (let d = 1; d <= today; d++) {
    if ((activity[d]?.qs ?? 0) > 0) {
      running++
    } else {
      if (running > bestStreak) bestStreak = running
      running = 0
      foundBreak = true
    }
  }
  if (!foundBreak) bestStreak = 0

  let daysPracticed = 0
  for (let d = 1; d <= today; d++) {
    if ((activity[d]?.qs ?? 0) > 0) daysPracticed++
  }

  return { currentStreak, bestStreak, daysPracticed }
}

const levelColors = [
  '#112236',
  '#25d6a218',
  '#25d6a240',
  '#25d6a270',
  '#25d6a2',
]

const levelTextColors = [
  '#2a4a6a',
  '#25d6a250',
  '#25d6a290',
  '#e8f4ff',
  '#071426',
]

export default function HeatMap({
  data = defaultData,
}: {
  data?: Record<MonthKey, MonthData>
}) {
  const [monthKey, setMonthKey] = useState<MonthKey>('2025-6')
  const [popup, setPopup] = useState<PopupState | null>(null)

  const m = data[monthKey]
  const { currentStreak, bestStreak, daysPracticed } = computeStreaks(m.activity, m.today)
  const maxQs = Math.max(...Object.values(m.activity).map((a) => a.qs))
  const totalWeeks = Math.ceil((m.startDay + m.days) / 7)

  const openPopup = (date: number, dayIdx: number) => {
    const activity = m.activity[date] ?? { qs: 0, mins: 0 }
    if (date > m.today) return
    setPopup({ date, dayIdx, activity, maxQs, monthName: m.name })
  }

  const degree = popup ? getDegree(popup.activity.qs) : null
  const pct = popup && popup.maxQs > 0
    ? Math.round((popup.activity.qs / popup.maxQs) * 100)
    : 0

  return (
    <>
      <div style={{ backgroundColor: '#0d1f35', border: '1px solid #1a3a5c', borderRadius: '16px', padding: '14px', margin: '0 14px' }}>
        {/* Header */}
<div className="flex items-center justify-between mb-[10px]">
  <span
    className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#25d6a2]"
    style={{ fontFamily: inter.style.fontFamily }}
  >
         Consistency
          </span>
          <select
  value={monthKey}
  onChange={(e) => setMonthKey(e.target.value as MonthKey)}
  className="appearance-none bg-[#112236] border border-[#1a3a5c] rounded-[8px] text-[11px] font-semibold text-[#a8c8e8] focus:outline-none cursor-pointer"
  style={{
    fontFamily: inter.style.fontFamily,
    padding: '4px 28px 4px 10px',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%234d6a87' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 6px center',
  }}
>
  <option value="2025-3">Apr 2025</option>
  <option value="2025-4">May 2025</option>
  <option value="2025-5">Jun 2025</option>
  <option value="2025-6">Jul 2025</option>
</select>
        </div>

        {/* Streak row */}
        
        <div
  style={{display: 'flex', gap: '5px', marginTop: '14px',  marginBottom: '10px',
  }}
>
  {[
    {
      icon: '🔥', value: String(currentStreak), label: 'Current', color: '#ff8c55',
    },
    {
      icon: '⚡', value: bestStreak > 0 ? String(bestStreak) : '—', label: 'Best Streak', color: '#25d6a2',
    },
    {
      icon: '📅',  value: String(daysPracticed), sub: `/${m.today}`,  label: 'Practiced', color: '#3FB7FF',
    },
  ].map((s) => (
    <div
  key={s.label}
  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#112236', border: '1px solid #1a3a5c',  borderRadius: '8px', padding: '6px 9px', minWidth: 0,  }}
>
      <span
        style={{  fontSize: '13px', lineHeight: 1,  flexShrink: 0,
        }}
      >
        {s.icon}
      </span>

      <div
        style={{
          minWidth: 0,
        }}
      >
        <p
          style={{
            fontFamily: spaceGrotesk.style.fontFamily,  fontSize: '14px',   fontWeight: 700, lineHeight: 1, margin: 0, color: s.color,
          }}
        >
          {s.value}

          {s.sub && (
            <span
              style={{
                fontFamily: inter.style.fontFamily,  fontSize: '9px',  color: '#4d6a87',  marginLeft: '1px',
              }}
            >
              {s.sub}
            </span>
          )}
        </p>

        <p
          style={{
            fontFamily: inter.style.fontFamily,   fontSize: '7px',   fontWeight: 500,   lineHeight: 1,    color: '#4d6a87',   textTransform: 'uppercase',     letterSpacing: '0.04em', margin: '2px 0 0', whiteSpace: 'nowrap',
          }}
        >
          {s.label}
        </p>
      </div>
    </div>
  ))}
</div>

        {/* Calendar grid */}
        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `18px repeat(${totalWeeks}, 1fr)` }}
        >
          {/* Column headers */}
          <div />
          {Array.from({ length: totalWeeks }, (_, w) => (
            <div
              key={w}
              className="text-[7px] font-semibold text-[#2a4a6a] text-center uppercase pb-[2px]"
              style={{ fontFamily: inter.style.fontFamily }}
            >
              W{w + 1}
            </div>
          ))}

          {/* Day rows */}
          {DAY_NAMES.map((day, d) => (
            <>
              <div
                key={`label-${d}`}
                className="text-[7px] font-semibold text-[#2a4a6a] uppercase flex items-center"
                style={{ fontFamily: inter.style.fontFamily }}
              >
                {day}
              </div>
              {Array.from({ length: totalWeeks }, (_, w) => {
                const date = w * 7 + d - m.startDay + 1
                const isOutOfRange = date < 1 || date > m.days
                const isFuture = date > m.today
                const activity = m.activity[date] ?? { qs: 0, mins: 0 }
                const level = isOutOfRange ? -1 : getLevel(activity.qs)
                const isToday = date === m.today

                if (isOutOfRange) {
                  return <div key={`${d}-${w}`} />
                }

                return (
                  <div
                    key={`${d}-${w}`}
                    onClick={() => !isFuture && openPopup(date, d)}
                    className="h-[26px] rounded-[4px] flex items-center justify-center text-[8px] font-semibold transition-transform active:scale-[0.85]"
                    style={{
                      background: levelColors[level],
                      color: levelTextColors[level],
                      opacity: isFuture ? 0.25 : 1,
                      cursor: isFuture ? 'default' : 'pointer',
                      border: isToday ? '1px solid #3FB7FF' : '1px solid transparent',
                      boxShadow: isToday ? '0 0 7px #3FB7FF40' : undefined,
                      fontFamily: inter.style.fontFamily,
                    }}
                  >
                    {date}
                  </div>
                )
              })}
            </>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-[5px] mt-[7px]">
          <span
            className="text-[8px] text-[#2a4a6a]"
            style={{ fontFamily: inter.style.fontFamily }}
          >
            None
          </span>
          <div className="flex gap-[2px]">
            {levelColors.map((c, i) => (
              <div
                key={i}
                className="w-[9px] h-[9px] rounded-[2px]"
                style={{ background: c }}
              />
            ))}
          </div>
          <span
            className="text-[8px] text-[#2a4a6a]"
            style={{ fontFamily: inter.style.fontFamily }}
          >
            Peak
          </span>
        </div>

      </div>

      {/* Day detail popup */}
      {popup && degree && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center"
          style={{
            background: '#07142670',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={(e) => e.target === e.currentTarget && setPopup(null)}
        >
          <div
               style={{ width: '100%',  maxWidth: '480px', backgroundColor: '#0d1f35',  border: '1px solid #1a3a5c',  borderRadius: '20px 20px 0 0', padding: '16px 14px 36px', animation: 'slideUp 0.2s ease',
  }}
>
            {/* Handle */}
            <div className="w-8 h-[3px] bg-[#1a3a5c] rounded-full mx-auto mb-[14px]" />

            {/* Header */}
            <div className="flex items-center justify-between mb-[10px]">
              <span
                className="text-[15px] font-bold text-[#e8f4ff]"
                style={{ fontFamily: spaceGrotesk.style.fontFamily }}
              >
                {DAY_NAMES[popup.dayIdx]}, {popup.monthName} {popup.date}
              </span>
              <button
                onClick={() => setPopup(null)}
                className="w-[26px] h-[26px] rounded-[7px] bg-[#112236] border border-[#1a3a5c] flex items-center justify-center text-[#4d6a87] text-[13px]"
              >
                ✕
              </button>
            </div>

            
            {/* Degree badge */}
<div  
  style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 14px',  borderRadius: '8px', backgroundColor: degree.bg, border: `1px solid ${degree.color}50`, marginBottom: '14px',
  }}
>
  <div
    style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: degree.color, flexShrink: 0,
    }}
  />

  <span
    style={{ fontFamily: inter.style.fontFamily, fontSize: '11px', fontWeight: 700, lineHeight: 1, color: degree.color,
    }}
  >
    {degree.label}
  </span>
</div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { icon: '❓', value: popup.activity.qs > 0 ? String(popup.activity.qs) : '—', label: 'Questions' },
                { icon: '⏱️', value: formatTime(popup.activity.mins), label: 'Study Time' },
              ].map((s) => (
                <div key={s.label} className="bg-[#112236] rounded-[10px] p-[10px_12px]">
                  <span className="text-[15px] block mb-[5px]">{s.icon}</span>
                  <span
                    className="text-[20px] font-bold text-[#e8f4ff] block leading-none mb-[2px]"
                    style={{ fontFamily: spaceGrotesk.style.fontFamily }}
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

            {/* Bar */}
            <p
              className="text-[10px] text-[#4d6a87] mb-[5px]"
              style={{ fontFamily: inter.style.fontFamily }}
            >
              {popup.activity.qs > 0
                ? `${pct}% of your best day (${popup.maxQs} Qs)`
                : 'No activity recorded'}
            </p>
            <ProgressBar value={pct} height="sm" color="#25d6a2" animated />
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
