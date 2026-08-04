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
  up:      'text-[#25d6a2] bg-[#25d6a215]',
  down:    'text-[#ff6b6b] bg-[#ff6b6b15]',
  neutral: 'text-[#4d6a87] bg-[#4d6a8715]',
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
      className={`
        bg-[#0d1f35]
        border border-[#1a3a5c]
        rounded-xl
        p-[10px_8px]
        flex flex-col
        items-center
        gap-[3px]
        text-center
        ${className}
      `}
    >
      {/* Icon */}
      <div
        className="w-6 h-6 rounded-[7px] flex items-center justify-center mb-[2px] flex-shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-[2px]">
        <span
          className="font-['Space_Grotesk'] text-[15px] font-bold leading-none"
          style={{ color: valueColor }}
        >
          {value}
        </span>
        {suffix && (
          <span className="font-['Inter'] text-[9px] font-medium text-[#4d6a87]">
            {suffix}
          </span>
        )}
      </div>

      {/* Label */}
      <span className="font-['Inter'] text-[8px] font-medium text-[#4d6a87] uppercase tracking-[0.05em] leading-[1.2] text-center">
        {label}
      </span>

      {/* Delta — optional */}
      {delta && (
        <span
          className={`
            font-['Inter'] text-[8px] font-semibold
            px-[6px] py-[1px] rounded-full mt-[1px]
            ${deltaColorMap[deltaDirection]}
          `}
        >
          {deltaIconMap[deltaDirection]} {delta}
        </span>
      )}
    </div>
  )
}
