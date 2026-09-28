'use client'

export default function MissionReading({
  seconds,
  estimatedMinutes,
  onDone,
}: {
  seconds: number
  estimatedMinutes: number
  onDone: () => void
}) {
  const progress = Math.max(0, Math.min(100, (seconds / (estimatedMinutes * 60)) * 100))

  return (
    <>
      <p className='stage-label'>Reading this concept</p>
      <h2>Stay with the concept.</h2>
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
