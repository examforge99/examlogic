'use client'

export default function MissionError({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className='nba-card'>
      <p className='stage-label'>Today’s Mission</p>
      <h2>We couldn’t load the mission.</h2>
      <p className='support mission-error'>{error}</p>
      <button className='primary' onClick={onRetry}>Try Again <span>→</span></button>
    </div>
  )
}
