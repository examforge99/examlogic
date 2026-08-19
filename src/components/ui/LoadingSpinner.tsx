// components/ui/LoadingSpinner.tsx

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const sizeMap = {
  sm: { width: '16px', height: '16px', borderWidth: '2px'   },
  md: { width: '24px', height: '24px', borderWidth: '2.5px' },
  lg: { width: '36px', height: '36px', borderWidth: '3px'   },
}

export default function LoadingSpinner({ size = 'md', color = '#25d6a2' }: LoadingSpinnerProps) {
  return (
    <>
      <div
        style={{
          ...sizeMap[size],
          borderRadius: '50%',
          borderStyle: 'solid',
          borderColor: '#1a3a5c',
          borderTopColor: color,
          animation: 'spin 0.7s linear infinite',
        }}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
