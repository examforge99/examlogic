// components/ui/SectionHeader.tsx

interface SectionHeaderProps {
  title: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function SectionHeader({
  title,
  action,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-[10px] ${className}`}>
      <span className="
        font-['Inter'] text-[10px] font-semibold
        uppercase tracking-[0.12em]
        text-[#25d6a2]
      ">
        {title}
      </span>
      {action && (
        <button
          onClick={action.onClick}
          className="
            font-['Inter'] text-[11px] font-semibold
            text-[#3FB7FF]
            active:opacity-70 transition-opacity
          "
        >
          {action.label} →
        </button>
      )}
    </div>
  )
}
