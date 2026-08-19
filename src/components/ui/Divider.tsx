// components/ui/Divider.tsx

interface DividerProps {
  color?: string
  style?: React.CSSProperties
}

export default function Divider({ color = '#1a3a5c', style }: DividerProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '1px',
        background: color,
        ...style,
      }}
    />
  )
}
