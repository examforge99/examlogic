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
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          paddingTop: '40px',
          paddingBottom: '40px',
          paddingLeft: '24px',
          paddingRight: '24px',
          gap: '12px',
        }}
      >
        {icon && (
          <span style={{ fontSize: '36px', marginBottom: '4px' }}>
            {icon}
          </span>
        )}

        <p
          style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '15px',
            fontWeight: 700,
            color: '#a8c8e8',
          }}
        >
          {title}
        </p>

        {description && (
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              fontWeight: 400,
              color: '#4d6a87',
              lineHeight: 1.6,
              maxWidth: '240px',
            }}
          >
            {description}
          </p>
        )}

        {action && (
          <button
            onClick={action.onClick}
            className="empty-state-btn"
            style={{
              marginTop: '8px',
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #1a3a5c',
              borderRadius: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 600,
              color: '#3FB7FF',
              cursor: 'pointer',
            }}
          >
            {action.label}
          </button>
        )}
      </div>

      <style>{`
        .empty-state-btn:active {
          background-color: #3FB7FF10;
        }
      `}</style>
    </>
  )
}
