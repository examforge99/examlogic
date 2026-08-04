// components/ui/LoadingSpinner.tsx

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4 border-[2px]',
  md: 'w-6 h-6 border-[2.5px]',
  lg: 'w-9 h-9 border-[3px]',
}

export default function LoadingSpinner({
  size = 'md',
  color = '#25d6a2',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <div className={`
      ${sizeMap[size]}
      rounded-full
      border-[#1a3a5c]
      animate-spin
      ${className}
    `}
      style={{ borderTopColor: color }}
    />
  )
}
