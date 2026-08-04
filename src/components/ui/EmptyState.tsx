// components/ui/EmptyState.tsx

import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string | ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`
      flex flex-col items-center justify-center
      text-center py-10 px-6 gap-3
      ${className}
    `}>
      {icon && (
        <span className="text-4xl mb-1">
          {icon}
        </span>
      )}
      <p className="font-['Space_Grotesk'] text-[15px] font-700 text-[#a8c8e8]">
        {title}
      </p>
      {description && (
        <p className="font-['Inter'] text-[12px] font-normal text-[#4d6a87] leading-relaxed max-w-[240px]">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="
            mt-2 px-5 py-[10px]
            bg-transparent
            border border-[#1a3a5c]
            rounded-[10px]
            font-['Inter'] text-[13px] font-semibold text-[#3FB7FF]
            active:bg-[#3FB7FF10] transition-colors
          "
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
