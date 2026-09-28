'use client'

export default function MissionLoading() {
  return (
    <div className='nba-card mission-loading-card' aria-label='Loading today’s mission' aria-busy='true'>
      <div className='card-topline'>
        <span className='identity-tag nba-tag'>Today’s Mission</span>
        <span className='skeleton skeleton-subject' />
      </div>
      <div className='loading-state'>
        <div className='skeleton skeleton-topic' />
        <div className='skeleton skeleton-title' />
        <div className='skeleton skeleton-title short' />
        <div className='skeleton-row'>
          <span className='skeleton skeleton-meta' />
          <span className='skeleton skeleton-meta small' />
        </div>
        <span className='skeleton skeleton-button' />
      </div>
    </div>
  )
}
