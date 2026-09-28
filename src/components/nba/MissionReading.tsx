'use client'

export default function MissionReading({
  seconds,
  estimatedMinutes,
  conceptName,
  onDone,
}: {
  seconds: number
  estimatedMinutes: number
  conceptName: string
  onDone: () => void
}) {
  const progress = Math.max(0, Math.min(100, (seconds / (estimatedMinutes * 60)) * 100))

  return (
    <>
      <p className='stage-label'>Reading this concept</p>
      <div
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          marginTop: 8,
          padding: '7px 11px',
          borderRadius: 10,
          background: 'rgba(245, 194, 66, 0.12)',
          border: '1px solid rgba(245, 194, 66, 0.28)',
          color: '#F5C242',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.35,
          overflowWrap: 'anywhere',
        }}
      >
        {conceptName}
      </div>
      <div className='timer'>{formatTime(seconds)}</div>
      <div className='progress'><span style={{ width: progress + '%' }} /></div>
      <div className='reading-info'>
        <span>Recommended: {estimatedMinutes} min</span>
        <span>Guide, not deadline</span>
      </div>
      <div className='reading-actions'>
        <button className='secondary' onClick={onDone}>I’m Done Reading</button>
      </div>
    </>
  )
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0')
}
