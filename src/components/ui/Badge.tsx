// components/ui/Badge.tsx

import { ReactNode } from 'react'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'orange'
  | 'ghost'

type BadgeSize = 'xs' | 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean                  // shows a colored dot before text
  dotPulse?: boolean             // pulsing dot for live/active states
  icon?: ReactNode               // optional icon before text
  className?: string
  onClick?: () => void
}

const variantMap: Record<BadgeVariant, { text: string; bg: string; border: string; dot: string }> = {
  default: {
    text:   'text-[#a8c8e8]',
    bg:     'bg-[#1a3a5c30]',
    border: 'border-[#1a3a5c]',
    dot:    '#a8c8e8',
  },
  success: {
    text:   'text-[#25d6a2]',
    bg:     'bg-[#25d6a215]',
    border: 'border-[#25d6a230]',
    dot:    '#25d6a2',
  },
  warning: {
    text:   'text-[#ff8c55]',
    bg:     'bg-[#ff8c5515]',
    border: 'border-[#ff8c5530]',
    dot:    '#ff8c55',
  },
  danger: {
    text:   'text-[#ff6b6b]',
    bg:     'bg-[#ff6b6b15]',
    border: 'border-[#ff6b6b30]',
    dot:    '#ff6b6b',
  },
  info: {
    text:   'text-[#3FB7FF]',
    bg:     'bg-[#3FB7FF15]',
    border: 'border-[#3FB7FF30]',
    dot:    '#3FB7FF',
  },
  purple: {
    text:   'text-[#a78bfa]',
    bg:     'bg-[#a78bfa15]',
    border: 'border-[#a78bfa30]',
    dot:    '#a78bfa',
  },
  orange: {
    text:   'text-[#ff8c55]',
    bg:     'bg-[#ff8c5515]',
    border: 'border-[#ff8c5530]',
    dot:    '#ff8c55',
  },
  ghost: {
    text:   'text-[#4d6a87]',
    bg:     'bg-transparent',
    border: 'border-[#1a3a5c]',
    dot:    '#4d6a87',
  },
}

const sizeMap: Record<BadgeSize, { padding: string; text: string; dotSize: string }> = {
  xs: {
    padding: 'px-[6px] py-[1px]',
    text:    'text-[8px]',
    dotSize: 'w-[5px] h-[5px]',
  },
  sm: {
    padding: 'px-[8px] py-[2px]',
    text:    'text-[9px]',
    dotSize: 'w-[6px] h-[6px]',
  },
  md: {
    padding: 'px-[10px] py-[3px]',
    text:    'text-[11px]',
    dotSize: 'w-[7px] h-[7px]',
  },
}

export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  dotPulse = false,
  icon,
  className = '',
  onClick,
}: BadgeProps) {
  const v = variantMap[variant]
  const s = sizeMap[size]

  return (
    <span
      onClick={onClick}
      className={`
        inline-flex items-center gap-[4px]
        ${s.padding}
        ${s.text}
        ${v.text}
        ${v.bg}
        border ${v.border}
        rounded-full
        font-['Inter'] font-semibold
        tracking-[0.04em]
        leading-none
        whitespace-nowrap
        ${onClick ? 'cursor-pointer active:opacity-80 transition-opacity' : ''}
        ${className}
      `}
    >
      {/* Dot */}
      {dot && (
        <span className="relative flex-shrink-0">
          <span
            className={`block rounded-full ${s.dotSize}`}
            style={{ background: v.dot }}
          />
          {dotPulse && (
            <span
              className={`absolute inset-0 rounded-full animate-ping opacity-60`}
              style={{ background: v.dot }}
            />
          )}
        </span>
      )}

      {/* Icon */}
      {icon && (
        <span className="flex-shrink-0 flex items-center">
          {icon}
        </span>
      )}

      {/* Text */}
      {children}
    </span>
  )
}
