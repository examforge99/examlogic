// components/ui/SectionHeader.tsx

interface SectionHeaderProps {
  title: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#25d6a2',
          }}
        >
          {title}
        </span>

        {action && (
          <button
            onClick={action.onClick}
            className="section-header-btn"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 600,
              color: '#3FB7FF',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {action.label} →
          </button>
        )}
      </div>

      <style>{`
        .section-header-btn:active {
          opacity: 0.7;
        }
      `}</style>
    </>
  )
}
