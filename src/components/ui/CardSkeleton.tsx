// components/ui/CardSkeleton.tsx
// Loading placeholder for cards while data fetches

interface CardSkeletonProps {
  height?: string
  className?: string
  rows?: number
}

function SkeletonLine({ width = 'w-full', height = 'h-[10px]' }: { width?: string; height?: string }) {
  return (
    <div className={`
      ${width} ${height}
      bg-[#112236]
      rounded-full
      animate-pulse
    `} />
  )
}

export default function CardSkeleton({
  height = '180px',
  className = '',
  rows = 3,
}: CardSkeletonProps) {
  return (
    <div
      className={`
        bg-[#0d1f35]
        border border-[#1a3a5c]
        rounded-2xl p-4
        flex flex-col gap-3
        ${className}
      `}
      style={{ minHeight: height }}
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <SkeletonLine width="w-[80px]" height="h-[8px]" />
        <SkeletonLine width="w-[50px]" height="h-[8px]" />
      </div>

      {/* Content rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <SkeletonLine width={i % 2 === 0 ? 'w-3/4' : 'w-1/2'} />
          <SkeletonLine height="h-[4px]" />
        </div>
      ))}
    </div>
  )
}
