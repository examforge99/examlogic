// components/analytics/DifficultyPerformanceCard.tsx
'use client'

import { useState } from 'react'
import { Inter, Space_Grotesk } from 'next/font/google'
import ProgressBar from '@/components/ui/ProgressBar'
import Divider from '@/components/ui/Divider'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['700'] })

type TimeRange = '7' | '30' | '90'

interface LevelData {
  accuracy: number
}

interface RangeData {
  levels: LevelData[]
  currentPoints: number
  nextLevelPoints: number
  currentLevel: number
}

interface DifficultyPerformanceCardProps {
  data?: Record<TimeRange, RangeData>
  className?: string
}

const LEVELS = [
  { label: 'Very Easy', color: '#25d6a2' },
  { label: 'Easy',      color: '#25d6a2' },
  { label: 'Medium',    color: '#3FB7FF' },
  { label: 'Hard',      color: '#ff8c55' },
  { label: 'Very Hard', color: '#ff6b6b' },
]

const defaultData: Record<TimeRange, RangeData> = {
  '7': {
    levels: [
      { accuracy: 98 },
      { accuracy: 92 },
      { accuracy: 81 },
      { accuracy: 56 },
      { accuracy: 31 },
    ],
    currentPoints: 750,
    nextLevelPoints: 1000,
    currentLevel: 3,
  },
  '30': {
    levels: [
      { accuracy: 97 },
      { accuracy: 90 },
      { accuracy: 78 },
      { accuracy: 51 },
      { accuracy: 28 },
    ],
    currentPoints: 620,
    nextLevelPoints: 1000,
    currentLevel: 3,
  },
  '90': {
    levels: [
      { accuracy: 95 },
      { accuracy: 88 },
      { accuracy: 74 },
      { accuracy: 48 },
      { accuracy: 22 },
    ],
    currentPoints: 480,
    nextLevelPoints: 1000,
    currentLevel: 3,
  },
}

export default function DifficultyPerformanceCard({
  data = defaultData,
  className = '',
}: DifficultyPerformanceCardProps) {
  const [range, setRange] = useState<TimeRange>('30')
  const d = data[range]

  const pct = Math.round((d.currentPoints / d.nextLevelPoints) * 100)
  const ptsToNext = d.nextLevelPoints - d.currentPoints
  const currentLevelLabel = LEVELS[d.currentLevel - 1].label

  return (
<div className={className} style={{ backgroundColor: '#0d1f35', border: '1px solid #1a3a5c',   borderRadius: '16px',   padding: '14px', }}
>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',  marginBottom: '14px', }}>
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#25d6a2]"
          style={{ fontFamily: inter.style.fontFamily }}
        >
          Difficulty Performance
        </span>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as TimeRange)}
          className="
            appearance-none bg-[#112236] border border-[#1a3a5c]
            rounded-[8px] px-2 py-1 pr-6
            text-[10px] font-semibold text-[#a8c8e8]
            focus:outline-none cursor-pointer
          "
          style={{
            fontFamily: inter.style.fontFamily,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%234d6a87' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 6px center',
          }}
        >
          <option value="7">7 Days</option>
          <option value="30">30 Days</option>
          <option value="90">90 Days</option>
        </select>
      </div>

      {/* Level rows */}
      <div style={{  display: 'flex',  flexDirection: 'column',   gap: '9px',   marginBottom: '14px',  }}
>
        {LEVELS.map((level, i) => {
          const acc = d.levels[i].accuracy
          return (
            <div key={i} className="flex items-center gap-[10px]">

              {/* Badge */}
              <div className="w-[42px] flex-shrink-0 flex flex-col gap-[1px]">
                <span
                  className="text-[11px] font-bold text-[#e8f4ff] leading-none"
                  style={{ fontFamily: spaceGrotesk.style.fontFamily }}
                >
                  Level {i + 1}
                </span>
                <span
                  className="text-[8px] font-medium text-[#4d6a87] whitespace-nowrap"
                  style={{ fontFamily: inter.style.fontFamily }}
                >
                  {level.label}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1">
                <ProgressBar
                  value={acc}
                  color={level.color}
                  height="sm"
                  animated
                />
              </div>

              {/* Accuracy */}
              <span
                className="text-[13px] font-bold w-[34px] text-right flex-shrink-0"
                style={{
                  fontFamily: spaceGrotesk.style.fontFamily,
                  color: level.color,
                }}
              >
                {acc}%
              </span>

            </div>
          )
        })}
      </div>

      <Divider className="mb-[14px]" />

      {/* Current level */}
      <div className="flex items-center justify-between mb-[10px]">
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#4d6a87]"
          style={{ fontFamily: inter.style.fontFamily }}
        >
          Your Current Level
        </span>
        <div
          className="flex items-center gap-[6px] px-[10px] py-[3px] rounded-full"
          style={{
            background: '#25d6a215',
            border: '1px solid #25d6a230',
          }}
        >
          <span
            className="w-[6px] h-[6px] rounded-full bg-[#25d6a2]"
            style={{ boxShadow: '0 0 5px #25d6a2' }}
          />
          <span
            className="text-[10px] font-bold text-[#25d6a2]"
            style={{ fontFamily: inter.style.fontFamily }}
          >
            Level {d.currentLevel} · {currentLevelLabel}
          </span>
        </div>
      </div>

      {/* Points row */}
      <div className="flex items-baseline justify-between mb-[6px]">
        <div className="flex items-baseline gap-1">
          <span
            className="text-[18px] font-bold text-[#e8f4ff] leading-none"
            style={{ fontFamily: spaceGrotesk.style.fontFamily }}
          >
            {d.currentPoints.toLocaleString()}
          </span>
          <span
            className="text-[11px] font-medium text-[#4d6a87]"
            style={{ fontFamily: inter.style.fontFamily }}
          >
            / {d.nextLevelPoints.toLocaleString()} pts
          </span>
        </div>
        <span
          className="text-[10px] font-semibold text-[#3FB7FF]"
          style={{ fontFamily: inter.style.fontFamily }}
        >
          {ptsToNext.toLocaleString()} pts to Level {d.currentLevel + 1}
        </span>
      </div>

      {/* Points bar */}
      <div className="mb-[6px]">
        <ProgressBar
          value={pct}
          height="lg"
          gradient={{ from: '#3FB7FF', to: '#25d6a2' }}
          showDot
          animated
        />
      </div>

      {/* Caption */}
      <p
        className="text-[10px] text-[#4d6a87]"
        style={{ fontFamily: inter.style.fontFamily }}
      >
        Answer more{' '}
        <span className="text-[#25d6a2] font-semibold">
          Level {d.currentLevel}
        </span>{' '}
        questions correctly to earn points and unlock Level {d.currentLevel + 1}
      </p>

    </div>
  )
      }
