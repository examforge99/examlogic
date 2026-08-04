// components/ui/Card.tsx

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  accent?: 'teal' | 'blue' | 'purple' | 'orange' | 'red' | 'none'
  accentPosition?: 'left' | 'top'
  onClick?: () => void
  href?: string
}

const paddingMap = {
  none: 'p-0',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
}

const accentColorMap = {
  teal:   'border-[#25d6a2]',
  blue:   'border-[#3FB7FF]',
  purple: 'border-[#a78bfa]',
  orange: 'border-[#ff8c55]',
  red:    'border-[#ff6b6b]',
  none:   '',
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  accent = 'none',
  accentPosition = 'left',
  onClick,
}: CardProps) {
  const hasAccent  = accent !== 'none'
  const accentClass = hasAccent
    ? accentPosition === 'left'
      ? `border-l-[3px] ${accentColorMap[accent]}`
      : `border-t-[3px] ${accentColorMap[accent]}`
    : ''

  return (
    <div
      onClick={onClick}
      className={`
        bg-[#0d1f35]
        border border-[#1a3a5c]
        rounded-2xl
        ${paddingMap[padding]}
        ${accentClass}
        ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform duration-150' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
