 // components/ui/DonutChart.tsx

interface DonutSegment {
  value: number
  color: string
  label?: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  strokeWidth?: number
  centerLabel?: string
  centerSub?: string
  centerColor?: string
}

export default function DonutChart({
  segments,
  size = 120,
  strokeWidth = 10,
  centerLabel,
  centerSub,
  centerColor = '#e8f4ff',
}: DonutChartProps) {
  const r = (size - strokeWidth) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r

  const total = segments.reduce((sum, s) => sum + s.value, 0)

  let cumulativeOffset = 0

  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#112236"
          strokeWidth={strokeWidth}
        />

        {/* Segments */}
        {segments.map((seg, i) => {
          const segLength = (seg.value / total) * circumference
          const offset = cumulativeOffset
          cumulativeOffset += segLength

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              strokeDasharray={`${segLength} ${circumference}`}
              strokeDashoffset={-offset}
            />
          )
        })}
      </svg>

      {/* Center text */}
      {(centerLabel || centerSub) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {centerLabel && (
            <span
              style={{
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 700,
                lineHeight: 1,
                fontSize: size * 0.2,
                color: centerColor,
              }}
            >
              {centerLabel}
            </span>
          )}
          {centerSub && (
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: size * 0.08,
                color: '#4d6a87',
                marginTop: '2px',
              }}
            >
              {centerSub}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
