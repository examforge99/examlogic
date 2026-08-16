// components/analytics/AccuracyTrendChart.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Inter, Space_Grotesk } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['700'] })

type TimeRange = '7' | '30' | '90'

interface DataPoint {
  v: number
  main: string
  sub: string
}

interface RangeData {
  stat: string
  delta: string
  deltaUp: boolean
  points: DataPoint[]
}

interface AccuracyTrendChartProps {
  data?: Record<TimeRange, RangeData>
  className?: string
}

const COLOR   = '#25d6a2'
const POINT_W = 72
const Y_LABELS = ['100%', '75%', '50%', '25%', '0%']

const defaultData: Record<TimeRange, RangeData> = {
  '7': {
    stat: '74%', delta: '↑ 6%', deltaUp: true,
    points: [
      { v: 68, main: 'Mon', sub: 'Jul 21' },
      { v: 71, main: 'Tue', sub: 'Jul 22' },
      { v: 74, main: 'Wed', sub: 'Jul 23' },
      { v: 70, main: 'Thu', sub: 'Jul 24' },
      { v: 76, main: 'Fri', sub: 'Jul 25' },
      { v: 78, main: 'Sat', sub: 'Jul 26' },
      { v: 74, main: 'Sun', sub: 'Jul 27' },
    ],
  },
  '30': {
    stat: '74%', delta: '↑ 6%', deltaUp: true,
    points: [
      { v: 65, main: 'Week 1', sub: 'Jul 1–7'   },
      { v: 70, main: 'Week 2', sub: 'Jul 8–14'  },
      { v: 72, main: 'Week 3', sub: 'Jul 15–21' },
      { v: 74, main: 'Week 4', sub: 'Jul 22–28' },
    ],
  },
  '90': {
    stat: '74%', delta: '↑ 16%', deltaUp: true,
    points: [
      { v: 58, main: 'May', sub: 'May 1–31' },
      { v: 66, main: 'Jun', sub: 'Jun 1–30' },
      { v: 74, main: 'Jul', sub: 'Jul 1–27' },
    ],
  },
}

export default function AccuracyTrendChart({
  data = defaultData,
  className = '',
}: AccuracyTrendChartProps) {
  const [range, setRange]       = useState<TimeRange>('7')
  const [tooltip, setTooltip]   = useState<{ x: number; y: number; text: string } | null>(null)
  const [panOffset, setPanOffset] = useState(0)

  const viewportRef = useRef<HTMLDivElement>(null)
  const svgClipRef  = useRef<HTMLDivElement>(null)
  const isDragging  = useRef(false)
  const dragStartX  = useRef(0)
  const panAtDrag   = useRef(0)

  const d      = data[range]
  const pts    = d.points
  const n      = pts.length
  const totalW = n * POINT_W

  const H  = 110
  const pT = 8
  const pB = 6
  const cH = H - pT - pB

  const xS = (i: number) => (i + 0.5) * POINT_W
  const yS = (v: number) => pT + cH - (v / 100) * cH

  const clipW  = svgClipRef.current?.offsetWidth ?? 280
  const maxPan = Math.max(0, totalW - clipW)

  // Reset pan when range changes
  useEffect(() => { setPanOffset(0) }, [range])

  const gridLines = [0, 25, 50, 75, 100].map((pct) => {
    const y = pT + cH - (pct / 100) * cH
    return (
      <line
        key={pct}
        x1={0} y1={y}
        x2={totalW} y2={y}
        stroke="#1a3a5c"
        strokeWidth={0.5}
        strokeDasharray="3,3"
      />
    )
  })

  const polyPts = pts.map((p, i) => `${xS(i)},${yS(p.v)}`).join(' ')
  const areaPts =
    `${xS(0)},${H - pB} ` +
    pts.map((p, i) => `${xS(i)},${yS(p.v)}`).join(' ') +
    ` ${xS(n - 1)},${H - pB}`

  // Drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    panAtDrag.current  = panOffset
  }, [panOffset])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const next = Math.max(0, Math.min(maxPan, panAtDrag.current - (e.clientX - dragStartX.current)))
    setPanOffset(next)
  }, [maxPan])

  const onMouseUp = useCallback(() => { isDragging.current = false }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true
    dragStartX.current = e.touches[0].clientX
    panAtDrag.current  = panOffset
  }, [panOffset])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    const next = Math.max(0, Math.min(maxPan, panAtDrag.current - (e.touches[0].clientX - dragStartX.current)))
    setPanOffset(next)
  }, [maxPan])

  const onTouchEnd = useCallback(() => { isDragging.current = false }, [])

  const showTooltip = (p: DataPoint, i: number) => {
    const clipRect = svgClipRef.current?.getBoundingClientRect()
    if (!clipRect) return
    const screenX = xS(i) - panOffset
    if (screenX < 0 || screenX > clipRect.width) return
    setTooltip({
      x: screenX,
      y: yS(p.v) - 30,
      text: `${p.main} (${p.sub}): ${p.v}%`,
    })
  }

  return (
    <div
      className={`
        bg-[#0d1f35] border border-[#1a3a5c]
        rounded-2xl p-[14px]
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-[10px]">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#25d6a2]"
          style={{ fontFamily: inter.style.fontFamily }}
        >
          Accuracy Trend
        </span>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as TimeRange)}
          className="
            appearance-none bg-[#112236] border border-[#1a3a5c]
            rounded-[8px] px-2 py-1 pr-6
            text-[11px] font-semibold text-[#a8c8e8]
            focus:outline-none focus:border-[#25d6a240]
            cursor-pointer
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

      {/* Stat row */}
      <div className="flex items-baseline gap-2 mb-3">
        <span
          className="text-[24px] font-bold text-[#e8f4ff] leading-none"
          style={{ fontFamily: spaceGrotesk.style.fontFamily }}
        >
          {d.stat}
        </span>
        <span
          className="text-[11px] text-[#4d6a87]"
          style={{ fontFamily: inter.style.fontFamily }}
        >
          avg accuracy
        </span>
        <span
          className={`
            text-[11px] font-semibold px-[7px] py-[2px] rounded-full
            ${d.deltaUp
              ? 'text-[#25d6a2] bg-[#25d6a215]'
              : 'text-[#ff6b6b] bg-[#ff6b6b15]'
            }
          `}
          style={{ fontFamily: inter.style.fontFamily }}
        >
          {d.delta}
        </span>
      </div>

      {/* Chart area */}
      <div className="flex gap-1 items-stretch">

        {/* Y axis */}
        <div className="flex flex-col justify-between w-[30px] flex-shrink-0 pb-[22px]">
          {Y_LABELS.map((l) => (
            <span
              key={l}
              className="text-[8px] font-medium text-[#2a4a6a] text-right leading-none"
              style={{ fontFamily: inter.style.fontFamily }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* Viewport */}
        <div
          ref={viewportRef}
          className="flex-1 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* SVG clip */}
          <div
            ref={svgClipRef}
            className="w-full relative overflow-hidden"
            style={{ height: H }}
          >
            <svg
              width={totalW}
              height={H}
              viewBox={`0 0 ${totalW} ${H}`}
              style={{ position: 'absolute', top: 0, left: -panOffset }}
            >
              <defs>
                <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={COLOR} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLOR} stopOpacity={0}    />
                </linearGradient>
              </defs>

              {gridLines}

              <polygon points={areaPts} fill="url(#accuracyGrad)" />

              <polyline
                points={polyPts}
                fill="none"
                stroke={COLOR}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={xS(i)}
                  cy={yS(p.v)}
                  r={4}
                  fill={COLOR}
                  stroke="#0d1f35"
                  strokeWidth={1.5}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => showTooltip(p, i)}
                  onMouseLeave={() => setTooltip(null)}
                  onTouchStart={() => showTooltip(p, i)}
                  onTouchEnd={() => setTooltip(null)}
                />
              ))}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div
                className="
                  absolute pointer-events-none z-10
                  bg-[#112236] border border-[#1a3a5c]
                  rounded-[7px] px-2 py-1
                  text-[10px] font-semibold text-[#e8f4ff]
                  whitespace-nowrap -translate-x-1/2
                "
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  fontFamily: inter.style.fontFamily,
                }}
              >
                {tooltip.text}
              </div>
            )}
          </div>

          {/* X labels */}
          <div className="w-full overflow-hidden relative h-[28px] mt-[3px]">
            <div
              className="absolute top-0 left-0 flex h-full"
              style={{
                width: totalW,
                transform: `translateX(${-panOffset}px)`,
              }}
            >
              {pts.map((p, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-start flex-shrink-0 gap-[1px] pt-[2px]"
                  style={{ width: POINT_W }}
                >
                  <span
                    className="text-[8px] font-semibold text-[#4d6a87] whitespace-nowrap"
                    style={{ fontFamily: inter.style.fontFamily }}
                  >
                    {p.main}
                  </span>
                  <span
                    className="text-[7px] text-[#2a4a6a] whitespace-nowrap"
                    style={{ fontFamily: inter.style.fontFamily }}
                  >
                    {p.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      {maxPan > 0 && (
        <div
          className="flex items-center justify-end gap-1 mt-1"
          style={{ fontFamily: inter.style.fontFamily }}
        >
          <span className="text-[8px] text-[#2a4a6a]">drag to scroll</span>
          <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#2a4a6a" strokeWidth={2}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}
    </div>
  )
}
