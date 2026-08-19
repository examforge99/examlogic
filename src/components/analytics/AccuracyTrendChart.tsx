'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Inter, Space_Grotesk } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['700'] })

type TimeRange = '7' | '30' | '90'

interface DayRow {
  date: string
  accuracy: number
  total_questions: number
  correct_answers: number
  study_time_mins: number
}

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

const COLOR = '#25d6a2'
const POINT_W = 72
const Y_LABELS = ['100%', '75%', '50%', '25%', '0%']

// ── helpers ──────────────────────────────────────────────────────────────────

function filterByDays(data: DayRow[], days: number): DayRow[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  return data.filter((r) => new Date(r.date) >= cutoff)
}

function toWeekLabel(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildRangeData(rows: DayRow[], range: TimeRange): RangeData {
  const days = range === '7' ? 7 : range === '30' ? 30 : 90
  const filtered = filterByDays(rows, days)

  if (filtered.length === 0) {
    return { stat: '—', delta: '—', deltaUp: true, points: [] }
  }

  let points: DataPoint[] = []

  if (range === '7') {
    points = filtered.map((r) => ({
      v: Math.round(Number(r.accuracy)),
      main: new Date(r.date).toLocaleDateString('en-US', { weekday: 'short' }),
      sub:  toWeekLabel(r.date),
    }))
  } else if (range === '30') {
    // group into weeks
    const weeks: Record<number, DayRow[]> = {}
    filtered.forEach((r) => {
      const d    = new Date(r.date)
      const week = Math.floor(
        (d.getTime() - new Date(filtered[0].date).getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
      if (!weeks[week]) weeks[week] = []
      weeks[week].push(r)
    })
    points = Object.entries(weeks).map(([w, rows]) => {
      const avg = rows.reduce((s, r) => s + Number(r.accuracy), 0) / rows.length
      const start = toWeekLabel(rows[0].date)
      const end   = toWeekLabel(rows[rows.length - 1].date)
      return {
        v:    Math.round(avg),
        main: `Week ${Number(w) + 1}`,
        sub:  `${start}–${end}`,
      }
    })
  } else {
    // group into months
    const months: Record<string, DayRow[]> = {}
    filtered.forEach((r) => {
      const key = r.date.slice(0, 7) // YYYY-MM
      if (!months[key]) months[key] = []
      months[key].push(r)
    })
    points = Object.entries(months).map(([key, rows]) => {
      const avg = rows.reduce((s, r) => s + Number(r.accuracy), 0) / rows.length
      const d   = new Date(key + '-01')
      return {
        v:    Math.round(avg),
        main: d.toLocaleDateString('en-US', { month: 'short' }),
        sub:  d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      }
    })
  }

  const avg     = Math.round(filtered.reduce((s, r) => s + Number(r.accuracy), 0) / filtered.length)
  const first   = Math.round(Number(filtered[0].accuracy))
  const last    = Math.round(Number(filtered[filtered.length - 1].accuracy))
  const diff    = last - first
  const deltaUp = diff >= 0

  return {
    stat:    `${avg}%`,
    delta:   `${deltaUp ? '↑' : '↓'} ${Math.abs(diff)}%`,
    deltaUp,
    points,
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export default function AccuracyTrendChart() {
  const [range, setRange]     = useState<TimeRange>('7')
  const [rawData, setRawData] = useState<DayRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [tooltip, setTooltip]   = useState<{ x: number; y: number; text: string } | null>(null)
  const [panOffset, setPanOffset] = useState(0)
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null)

  const svgClipRef  = useRef<HTMLDivElement>(null)
  const isDragging  = useRef(false)
  const dragStartX  = useRef(0)
  const panAtDrag   = useRef(0)

  // ── fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setFetchError(null)
        const res = await fetch('/api/analytics/accuracy')
        if (!res.ok) {
          const body = await res.json()
          setFetchError(body.message ?? 'Failed to load accuracy data.')
          return
        }
        const { data } = await res.json()
        setRawData(data ?? [])
      } catch {
        setFetchError('Something went wrong loading your accuracy data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ── derived data ─────────────────────────────────────────────────────────
  const d      = buildRangeData(rawData, range)
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

  // ── pan handlers ─────────────────────────────────────────────────────────
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

  // ── keyboard pan ─────────────────────────────────────────────────────────
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setPanOffset((p) => Math.min(maxPan, p + POINT_W))
    if (e.key === 'ArrowLeft')  setPanOffset((p) => Math.max(0, p - POINT_W))
  }, [maxPan])

  const showTooltip = (p: DataPoint, i: number) => {
    const clipRect = svgClipRef.current?.getBoundingClientRect()
    if (!clipRect) return
    const screenX = xS(i) - panOffset
    if (screenX < 0 || screenX > clipRect.width) return
    setTooltip({ x: screenX, y: yS(p.v) - 30, text: `${p.main} (${p.sub}): ${p.v}%` })
  }

  // ── loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          margin: '0 14px',
          backgroundColor: '#0d1f35',
          border: '1px solid #1a3a5c',
          borderRadius: '10px',
          padding: '14px',
          minHeight: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: inter.style.fontFamily, fontSize: '12px', color: '#4d6a87' }}>
          Loading accuracy data...
        </span>
      </div>
    )
  }

  // ── error state ───────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div
        style={{
          margin: '0 14px',
          backgroundColor: '#0d1f35',
          border: '1px solid #1a3a5c',
          borderRadius: '10px',
          padding: '14px',
          minHeight: '180px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontFamily: inter.style.fontFamily, fontSize: '12px', color: '#ff6b6b', textAlign: 'center' }}>
          {fetchError}
        </span>
        <button
          onClick={() => window.location.reload()}
          style={{
            fontFamily: inter.style.fontFamily,
            fontSize: '11px',
            fontWeight: 600,
            color: '#3FB7FF',
            background: 'none',
            border: '1px solid #3FB7FF50',
            borderRadius: '8px',
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  // ── empty state ───────────────────────────────────────────────────────────
  if (pts.length === 0) {
    return (
      <div
        style={{
          margin: '0 14px',
          backgroundColor: '#0d1f35',
          border: '1px solid #1a3a5c',
          borderRadius: '10px',
          padding: '14px',
          minHeight: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: inter.style.fontFamily, fontSize: '12px', color: '#4d6a87' }}>
          No activity in the last {range} days. Start a session to see your trend.
        </span>
      </div>
    )
  }

  // ── chart ─────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        margin: '0 14px',
        backgroundColor: '#0d1f35',
        border: '1px solid #1a3a5c',
        borderRadius: '10px',
        padding: '14px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        <span
          style={{
            fontFamily: inter.style.fontFamily,
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#25d6a2',
          }}
        >
          Accuracy Trend
        </span>
        <select
          value={range}
          onChange={(e) => { setRange(e.target.value as TimeRange); setPanOffset(0) }}
          aria-label="Select time range"
          style={{
            fontFamily: inter.style.fontFamily,
            backgroundColor: '#112236',
            border: '1px solid #1a3a5c',
            borderRadius: '8px',
            padding: '4px 28px 4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#a8c8e8',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
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
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        <span
          style={{
            fontFamily: spaceGrotesk.style.fontFamily,
            fontSize: '24px',
            fontWeight: 700,
            color: '#e8f4ff',
            lineHeight: 1,
          }}
        >
          {d.stat}
        </span>
        <span
          style={{
            fontFamily: inter.style.fontFamily,
            fontSize: '11px',
            color: '#4d6a87',
          }}
        >
          avg accuracy
        </span>
        <span
          style={{
            fontFamily: inter.style.fontFamily,
            fontSize: '11px',
            fontWeight: 600,
            color: d.deltaUp ? '#25d6a2' : '#ff6b6b',
            backgroundColor: d.deltaUp ? '#25d6a215' : '#ff6b6b15',
            borderRadius: '999px',
            padding: '4px 10px',
          }}
        >
          {d.delta}
        </span>
      </div>

      {/* Chart */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'stretch' }}>

        {/* Y axis */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '30px',
            flexShrink: 0,
            paddingBottom: '22px',
          }}
          aria-hidden="true"
        >
          {Y_LABELS.map((l) => (
            <span
              key={l}
              style={{
                fontFamily: inter.style.fontFamily,
                fontSize: '8px',
                fontWeight: 500,
                color: '#2a4a6a',
                textAlign: 'right',
                lineHeight: 1,
              }}
            >
              {l}
            </span>
          ))}
        </div>

        {/* Viewport */}
        <div
          role="region"
          aria-label="Accuracy trend chart. Use arrow keys to scroll left and right."
          tabIndex={0}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onKeyDown={onKeyDown}
          style={{
            flex: 1,
            cursor: 'grab',
            userSelect: 'none',
            outline: 'none',
          }}
        >
          {/* SVG clip */}
          <div
            ref={svgClipRef}
            style={{ width: '100%', position: 'relative', overflow: 'hidden', height: H }}
          >
            <svg
              width={totalW}
              height={H}
              viewBox={`0 0 ${totalW} ${H}`}
              aria-hidden="true"
              style={{ position: 'absolute', top: 0, left: -panOffset }}
            >
              <defs>
                <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={COLOR} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
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
                  r={focusedIdx === i ? 6 : 4}
                  fill={COLOR}
                  stroke="#0d1f35"
                  strokeWidth={1.5}
                  role="img"
                  aria-label={`${p.main} ${p.sub}: ${p.v}% accuracy`}
                  tabIndex={0}
                  style={{ cursor: 'pointer', outline: 'none' }}
                  onMouseEnter={() => { showTooltip(p, i); setFocusedIdx(i) }}
                  onMouseLeave={() => { setTooltip(null); setFocusedIdx(null) }}
                  onFocus={() => { showTooltip(p, i); setFocusedIdx(i) }}
                  onBlur={() => { setTooltip(null); setFocusedIdx(null) }}
                  onTouchStart={() => showTooltip(p, i)}
                  onTouchEnd={() => setTooltip(null)}
                />
              ))}
            </svg>

            {tooltip && (
              <div
                role="tooltip"
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  zIndex: 10,
                  backgroundColor: '#112236',
                  border: '1px solid #1a3a5c',
                  borderRadius: '7px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#e8f4ff',
                  whiteSpace: 'nowrap',
                  fontFamily: inter.style.fontFamily,
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translateX(-50%)',
                }}
              >
                {tooltip.text}
              </div>
            )}
          </div>

          {/* X labels */}
          <div style={{ width: '100%', overflow: 'hidden', position: 'relative', height: '28px', marginTop: '3px' }}>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                display: 'flex',
                height: '100%',
                width: totalW,
                transform: `translateX(${-panOffset}px)`,
              }}
            >
              {pts.map((p, i) => (
                <div
                  key={i}
                  style={{
                    width: POINT_W,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    flexShrink: 0,
                    gap: '1px',
                    paddingTop: '2px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: inter.style.fontFamily,
                      fontSize: '8px',
                      fontWeight: 600,
                      color: '#4d6a87',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.main}
                  </span>
                  <span
                    style={{
                      fontFamily: inter.style.fontFamily,
                      fontSize: '7px',
                      color: '#2a4a6a',
                      whiteSpace: 'nowrap',
                    }}
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
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '4px',
            marginTop: '4px',
          }}
          aria-hidden="true"
        >
          <span style={{ fontFamily: inter.style.fontFamily, fontSize: '8px', color: '#2a4a6a' }}>
            drag to scroll
          </span>
          <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="#2a4a6a" strokeWidth={2}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}
    </div>
  )
        }
