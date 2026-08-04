// components/ui/Divider.tsx

interface DividerProps {
  className?: string
  color?: string
}

export default function Divider({
  className = '',
  color = '#1a3a5c',
}: DividerProps) {
  return (
    <div
      className={`w-full h-px ${className}`}
      style={{ background: color }}
    />
  )
}
