'use client'

export default function MissionEmpty({ onContinue }: { onContinue: () => void }) {
  return (
    <div className='nba-card'>
      <p className='stage-label'>Today’s Mission</p>
      <h2>This NBA batch is complete.</h2>
      <p className='support'>Your scheduled work is complete. You can keep going when you choose.</p>
      <button className='primary' onClick={onContinue}>Continue <span>→</span></button>
    </div>
  )
}
