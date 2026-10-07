'use client'

import Link from 'next/link'
import { ArrowRight, Clock3, Crosshair, Flame, Play, Sparkles, Target, Trophy } from 'lucide-react'

const modes = [
  {
    href: '/quick-fire',
    label: 'Quick Fire',
    eyebrow: 'Build the habit',
    title: 'A focused 20-question sprint.',
    detail: 'Five questions from each of your registered subjects, selected around your current level.',
    facts: ['20 questions', '15 minutes', '5 sessions/hour'],
    icon: Sparkles,
    tone: 'blue',
  },
  {
    href: '/campaign',
    label: 'Campaign',
    eyebrow: 'Train a weakness',
    title: 'Choose exactly what to practise.',
    detail: 'Build a focused set by subject and topic, with untimed or timed practice depending on your goal.',
    facts: ['5–50 per subject', 'Topic-focused', 'Timed or untimed'],
    icon: Target,
    tone: 'green',
  },
  {
    href: '/simulation',
    label: 'JAMB Simulation',
    eyebrow: 'Rehearse the exam',
    title: 'A full exam environment.',
    detail: 'A 180-question, 120-minute simulation built around your registered JAMB combination.',
    facts: ['180 questions', '120 minutes', 'Full navigation'],
    icon: Clock3,
    tone: 'purple',
  },
  {
    href: '/sudden-death',
    label: 'Sudden Death',
    eyebrow: 'Find your ceiling',
    title: 'One question at a time. No safety net.',
    detail: 'Start at your current difficulty and climb as your streak proves you can handle harder questions.',
    facts: ['Adaptive difficulty', 'Timed questions', 'One mistake ends the run'],
    icon: Flame,
    tone: 'orange',
  },
]

export default function PracticePage() {
  return (
    <div className="practice-new">
      <header className="practice-header">
        <div>
          <p className="practice-overline">Practice</p>
          <h1>Choose how you want to train.</h1>
        </div>
        <Link href="/dashboard" className="practice-back">Back</Link>
      </header>

      <main className="practice-main">
        <section className="practice-intro">
          <div>
            <p className="practice-kicker">Four ways to prepare</p>
            <h2>Different sessions. Different jobs.</h2>
          </div>
          <p>Pick the mode that matches what you need right now. Your preparation does not have to look the same every day.</p>
        </section>

        <section className="practice-grid" aria-label="Practice modes">
          {modes.map(({ href, label, eyebrow, title, detail, facts, icon: Icon, tone }) => (
            <Link key={href} href={href} className={'practice-mode practice-mode-' + tone}>
              <div className="practice-mode-top">
                <span className="practice-mode-icon"><Icon size={18} /></span>
                <span className="practice-mode-arrow"><ArrowRight size={17} /></span>
              </div>
              <p className="practice-mode-eyebrow">{eyebrow}</p>
              <h3>{label}</h3>
              <strong>{title}</strong>
              <p className="practice-mode-detail">{detail}</p>
              <div className="practice-facts">
                {facts.map(fact => <span key={fact}>{fact}</span>)}
              </div>
            </Link>
          ))}
        </section>

        <section className="practice-guidance">
          <div className="practice-guidance-icon"><Crosshair size={18} /></div>
          <div>
            <p>Not sure what to choose?</p>
            <strong>Start with Today's Mission.</strong>
            <span>ExamLogic's decision engine already considers what you should work on next.</span>
          </div>
          <Link href="/dashboard" aria-label="Go to today's mission"><ArrowRight size={18} /></Link>
        </section>

        <section className="practice-note">
          <Trophy size={16} />
          <span>Every session contributes to your preparation history and the signals used across ExamLogic.</span>
        </section>
      </main>

      <nav className="practice-nav" aria-label="Primary navigation">
        <Link href="/dashboard">Home</Link>
        <Link href="/subjects">Subjects</Link>
        <Link href="/practice" aria-current="page">Practice</Link>
        <Link href="/analytics">Analytics</Link>
        <Link href="/profile">Profile</Link>
      </nav>
    </div>
  )
}
