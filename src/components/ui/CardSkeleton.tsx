// components/ui/CardSkeleton.tsx
// Loading placeholder for cards while data fetches

interface CardSkeletonProps {
  height?: string
  rows?: number
}

function SkeletonLine({ width = '100%', height = '10px' }: { width?: string; height?: string }) {
  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#112236',
        borderRadius: '999px',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}
    />
  )
}

export default function CardSkeleton({ height = '180px', rows = 3 }: CardSkeletonProps) {
  return (
    <>
      <div
        style={{
          minHeight: height,
          backgroundColor: '#0d1f35',
          border: '1px solid #1a3a5c',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {/* Header skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkeletonLine width="80px" height="8px" />
          <SkeletonLine width="50px" height="8px" />
        </div>

        {/* Content rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SkeletonLine width={i % 2 === 0 ? '75%' : '50%'} />
            <SkeletonLine height="4px" />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </>
  )
}
