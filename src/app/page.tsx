import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <span className="text-xl font-bold text-primary">ExamLogic</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary-light transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold text-primary bg-primary-light rounded-full">
          🎮 JAMB Prep That Feels Like a Game
        </div>
        <h1 className="text-4xl font-extrabold text-text-primary leading-tight mb-4">
          Stop Studying.<br />
          <span className="text-primary">Start Competing.</span>
        </h1>
        <p className="text-base text-text-secondary max-w-sm mx-auto mb-8">
          Practice JAMB questions through live game modes, earn rewards, climb leaderboards, and actually enjoy preparing for your exam.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 text-base font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-blue-md active:scale-95"
        >
          Play Your First Game →
        </Link>
      </section>

      {/* Modes */}
      <section className="px-6 pb-12">
        <h2 className="text-lg font-bold text-text-primary mb-4 text-center">
          Four Ways to Win
        </h2>
        <div className="flex flex-col gap-3">
          {[
            { emoji: "⚡", name: "Quick Fire", desc: "20 questions, beat the clock" },
            { emoji: "🎯", name: "Campaign", desc: "Master one subject at a time" },
            { emoji: "📝", name: "JAMB Simulation", desc: "Full 180-question mock exam" },
            { emoji: "💀", name: "Sudden Death", desc: "One wrong answer ends it all" },
          ].map((mode) => (
            <div
              key={mode.name}
              className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border"
            >
              <span className="text-2xl">{mode.emoji}</span>
              <div>
                <p className="font-semibold text-text-primary text-sm">{mode.name}</p>
                <p className="text-xs text-text-secondary">{mode.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mx-6 mb-12 p-6 bg-primary rounded-2xl text-white text-center">
        <p className="text-3xl font-extrabold mb-1">Recruit → Legend</p>
        <p className="text-sm opacity-80">
          5 rank tiers. Earn your way up through speed, accuracy, consistency and depth.
        </p>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16 text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Ready to Play?
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          Free to start. No boring textbooks required.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 text-base font-bold text-white bg-primary rounded-xl hover:bg-primary-dark transition-all shadow-blue-md active:scale-95"
        >
          Create Free Account →
        </Link>
      </section>
    </main>
  );
}
