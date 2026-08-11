// components/ui/ProgressBar.tsx

interface ProgressBarProps {
  value: number                          // 0–100
  max?: number                           // defaults to 100
  color?: string                         // hex color for fill
  trackColor?: string                    // hex color for track
  height?: 'xs' | 'sm' | 'md' | 'lg'   // bar thickness
  showGlow?: boolean                     // glowing tip on fill end
  showDot?: boolean                      // dot at fill end (like mission card)
  animated?: boolean                     // animate fill on mount
  rounded?: boolean                      // fully rounded or squared ends
  gradient?: {                           // optional gradient instead of solid
    from: string
    to: string
  }
  className?: string
}

const heightMap = {
  xs: 'h-[3px]',
  sm: 'h-[4px]',
  md: 'h-[6px]',
  lg: 'h-[8px]',
}

export default function ProgressBar({
  value,
  max = 100,
  color = '#25d6a2',
  trackColor = '#112236',
  height = 'sm',
  showGlow = false,
  showDot = false,
  animated = true,
  rounded = true,
  gradient,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  const fillStyle: React.CSSProperties = {
    width: `${pct}%`,
    background: gradient
      ? `linear-gradient(90deg, ${gradient.from}, ${gradient.to})`
      : color,
    boxShadow: showGlow ? `0 0 8px ${color}aa` : undefined,
    transition: animated ? 'width 0.6s ease' : undefined,
  }

  return (
    <div
      className={`
        w-full relative
        ${heightMap[height]}
        ${rounded ? 'rounded-full' : 'rounded-none'}
        overflow-visible
        ${className}
      `}
      style={{ background: trackColor }}
    >
      {/* Fill */}
      <div
        className={`
          h-full relative
          ${rounded ? 'rounded-full' : 'rounded-none'}
        `}
        style={fillStyle}
      >
        {/* Glowing dot at end */}
        {showDot && pct > 0 && (
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full"
            style={{
              width:     height === 'xs' ? 8  : height === 'sm' ? 10 : height === 'md' ? 12 : 14,
              height:    height === 'xs' ? 8  : height === 'sm' ? 10 : height === 'md' ? 12 : 14,
              background: gradient ? gradient.to : color,
              boxShadow: `0 0 6px ${gradient ? gradient.to : color}`,
              transform: 'translate(50%, -50%)',
            }}
          />
        )}
      </div>
    </div>
  )
}
