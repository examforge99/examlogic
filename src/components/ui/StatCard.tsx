// components/ui/StatCard.tsx

import { ReactNode } from 'react'

interface StatCardProps {
  value: string | number
  label: string
  icon: ReactNode
  iconBg?: string
  valueColor?: string
  suffix?: string
  delta?: string
  deltaDirection?: 'up' | 'down' | 'neutral'
  className?: string
}

const deltaColorMap = {
  up:      { color: '#25d6a2', backgroundColor: 'rgba(37, 214, 162, 0.08)' },
  down:    { color: '#ff6b6b', backgroundColor: 'rgba(255, 107, 107, 0.08)' },
  neutral: { color: '#4d6a87', backgroundColor: 'rgba(77, 106, 135, 0.08)' },
}

const deltaIconMap = {
  up:      '↑',
  down:    '↓',
  neutral: '→',
}

export default function StatCard({
  value,
  label,
  icon,
  iconBg = '#3FB7FF15',
  valueColor = '#e8f4ff',
  suffix,
  delta,
  deltaDirection = 'neutral',
  className = '',
}: StatCardProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: '#0d1f35',
        border: '1px solid #1a3a5c',
        borderRadius: '12px',
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '3px',
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2px',
          flexShrink: 0,
          background: iconBg,
        }}
      >
        {icon}
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '15px',
            fontWeight: 700,
            lineHeight: 1,
            color: valueColor,
          }}
        >
          {value}
        </span>
        {suffix && (
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '9px',
            fontWeight: 500,
            color: '#4d6a87',
          }}>
            {suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <span style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: '8px',
        fontWeight: 500,
        color: '#4d6a87',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: 1.2,
        textAlign: 'center',
      }}>
        {label}
      </span>

      {/* Delta — optional */}
      {delta && (
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '8px',
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: '9999px',
            marginTop: '1px',
            ...deltaColorMap[deltaDirection],
          }}
        >
          {deltaIconMap[deltaDirection]} {delta}
        </span>
      )}
    </div>
  )
}
