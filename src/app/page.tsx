// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A]">
      {/* Sticky Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#3B82F6] tracking-tight">
            ExamLogic
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-[#3B82F6] border-2 border-[#3B82F6] rounded-full hover:bg-[#3B82F6]/5 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#3B82F6] rounded-full hover:bg-[#2563EB] transition-colors shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Stop Studying.
            <br />
            <span className="text-[#3B82F6]">Start Competing.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            The JAMB prep platform that feels like a mobile game. Battle questions, climb the ranks, and crush your exam — without boring textbooks.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 text-lg font-bold text-white bg-[#3B82F6] rounded-2xl shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:bg-[#2563EB] hover:shadow-[0_0_50px_-10px_rgba(59,130,246,0.6)] transition-all active:scale-95"
            >
              Play Your First Match
            </Link>
          </div>
        </div>
      </section>

      {/* Game Modes */}
      <section className="px-4 py-16 bg-[#F0F6FF]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            Pick Your <span className="text-[#3B82F6]">Game Mode</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick Fire */}
            <div className="group bg-white rounded-2xl p-6 border border-[#E2E8F0] hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-[#3B82F6]/10 transition-all cursor-pointer">
              <div className="w-12 h-12 flex items-center justify-center text-2xl bg-[#FEF3C7] rounded-xl mb-4">
                ⚡
              </div>
              <h3 className="text-lg font-bold mb-1">Quick Fire</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                60-second speed rounds. How many can you nail before time runs out?
              </p>
              <div className="mt-4 h-1 w-12 bg-[#F59E0B] rounded-full group-hover:w-full transition-all duration-500" />
            </div>

            {/* Campaign */}
            <div className="group bg-white rounded-2xl p-6 border border-[#E2E8F0] hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-[#3B82F6]/10 transition-all cursor-pointer">
              <div className="w-12 h-12 flex items-center justify-center text-2xl bg-[#DBEAFE] rounded-xl mb-4">
                🎯
              </div>
              <h3 className="text-lg font-bold mb-1">Campaign</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Level-based missions across every JAMB subject. Unlock topics as you progress.
              </p>
              <div className="mt-4 h-1 w-12 bg-[#3B82F6] rounded-full group-hover:w-full transition-all duration-500" />
            </div>

            {/* JAMB Simulation */}
            <div className="group bg-white rounded-2xl p-6 border border-[#E2E8F0] hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-[#3B82F6]/10 transition-all cursor-pointer">
              <div className="w-12 h-12 flex items-center justify-center text-2xl bg-[#DCFCE7] rounded-xl mb-4">
                📝
              </div>
              <h3 className="text-lg font-bold mb-1">JAMB Simulation</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Full-length mock exams with real timing. Feel the pressure before the big day.
              </p>
              <div className="mt-4 h-1 w-12 bg-[#22C55E] rounded-full group-hover:w-full transition-all duration-500" />
            </div>

            {/* Sudden Death */}
            <div className="group bg-white rounded-2xl p-6 border border-[#E2E8F0] hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-[#3B82F6]/10 transition-all cursor-pointer">
              <div className="w-12 h-12 flex items-center justify-center text-2xl bg-[#FEE2E2] rounded-xl mb-4">
                💀
              </div>
              <h3 className="text-lg font-bold mb-1">Sudden Death</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                One wrong answer and you are out. How far can your streak take you?
              </p>
              <div className="mt-4 h-1 w-12 bg-[#EF4444] rounded-full group-hover:w-full transition-all duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Rank Progression */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Climb the <span className="text-[#3B82F6]">Ranks</span>
          </h2>
          <p className="text-center text-[#64748B] mb-12 max-w-lg mx-auto">
            Earn XP, unlock badges, and prove you are the best. Every question answered pushes you higher.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6">
            {/* Recruit */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-3xl bg-[#F1F5F9] border-2 border-[#CBD5E1] rounded-2xl">
                🥉
              </div>
              <span className="mt-3 text-sm font-bold text-[#94A3B8]">Recruit</span>
            </div>

            {/* Arrow */}
            <div className="hidden md:block text-[#CBD5E1]">→</div>
            <div className="md:hidden text-[#CBD5E1] rotate-90">→</div>

            {/* Scholar */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-3xl bg-[#DBEAFE] border-2 border-[#93C5FD] rounded-2xl">
                📘
              </div>
              <span className="mt-3 text-sm font-bold text-[#60A5FA]">Scholar</span>
            </div>

            {/* Arrow */}
            <div className="hidden md:block text-[#93C5FD]">→</div>
            <div className="md:hidden text-[#93C5FD] rotate-90">→</div>

            {/* Expert */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-3xl bg-[#BFDBFE] border-2 border-[#60A5FA] rounded-2xl shadow-md shadow-[#3B82F6]/20">
                🧠
              </div>
              <span className="mt-3 text-sm font-bold text-[#3B82F6]">Expert</span>
            </div>

            {/* Arrow */}
            <div className="hidden md:block text-[#60A5FA]">→</div>
            <div className="md:hidden text-[#60A5FA] rotate-90">→</div>

            {/* Master */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-3xl bg-[#93C5FD] border-2 border-[#3B82F6] rounded-2xl shadow-lg shadow-[#3B82F6]/30">
                👑
              </div>
              <span className="mt-3 text-sm font-bold text-[#2563EB]">Master</span>
            </div>

            {/* Arrow */}
            <div className="hidden md:block text-[#3B82F6]">→</div>
            <div className="md:hidden text-[#3B82F6] rotate-90">→</div>

            {/* Legend */}
            <div className="flex flex-col items-center relative">
              <div className="absolute -inset-1 bg-[#3B82F6]/20 rounded-3xl blur-md" />
              <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-3xl bg-[#3B82F6] border-2 border-[#1D4ED8] rounded-2xl shadow-xl shadow-[#3B82F6]/40">
                🔥
              </div>
              <span className="relative mt-3 text-sm font-bold text-[#1D4ED8]">Legend</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="px-4 py-16 bg-[#F0F6FF]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Leaderboard Preview */}
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">🏆 Weekly Leaderboard</h3>
                <span className="text-xs font-semibold text-[#3B82F6] bg-[#DBEAFE] px-3 py-1 rounded-full">
                  Live
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { rank: 1, name: "Chidera.O", score: "12,450 XP", badge: "🔥", color: "bg-[#FEF3C7]" },
                  { rank: 2, name: "Amaka_J", score: "11,890 XP", badge: "⚡", color: "bg-[#F1F5F9]" },
                  { rank: 3, name: "Tobi_X", score: "10,720 XP", badge: "🎯", color: "bg-[#FFF7ED]" },
                  { rank: 4, name: "You", score: "—", badge: "👤", color: "bg-[#DBEAFE] border-2 border-[#3B82F6]" },
                ].map((player) => (
                  <div
                    key={player.rank}
                    className={`flex items-center gap-4 p-3 rounded-xl ${player.color} ${player.rank === 4 ? "ring-2 ring-[#3B82F6]/20" : ""}`}
                  >
                    <span className="w-8 text-center font-bold text-[#64748B] text-sm">
                      {player.rank === 4 ? "??" : `#${player.rank}`}
                    </span>
                    <span className="text-lg">{player.badge}</span>
                    <span className={`flex-1 font-semibold text-sm ${player.rank === 4 ? "text-[#3B82F6]" : "text-[#0F172A]"}`}>
                      {player.name}
                    </span>
                    <span className="text-sm font-bold text-[#64748B]">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] text-center">
                <div className="text-4xl font-extrabold text-[#3B82F6]">50K+</div>
                <div className="text-sm text-[#64748B] font-medium mt-1">Students Competing</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] text-center">
                <div className="text-4xl font-extrabold text-[#22C55E]">2.4M</div>
                <div className="text-sm text-[#64748B] font-medium mt-1">Questions Answered</div>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] text-center">
                <div className="text-4xl font-extrabold text-[#F59E0B]">🔥 14</div>
                <div className="text-sm text-[#64748B] font-medium mt-1">Day Streak Record</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#3B82F6] rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Ready to Play?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-lg mx-auto">
                Join 50,000+ students turning JAMB prep into their favorite game. Free to start — no boring textbooks required.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center px-8 py-4 text-lg font-bold text-[#3B82F6] bg-white rounded-2xl shadow-xl hover:bg-[#F0F6FF] hover:scale-105 transition-all active:scale-95"
              >
                Start Playing Free →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-[#3B82F6]">ExamLogic</span>
          <div className="flex items-center gap-6 text-sm text-[#64748B]">
            <Link href="/about" className="hover:text-[#3B82F6] transition-colors">About</Link>
            <Link href="/leaderboard" className="hover:text-[#3B82F6] transition-colors">Leaderboard</Link>
            <Link href="/privacy" className="hover:text-[#3B82F6] transition-colors">Privacy</Link>
          </div>
          <span className="text-xs text-[#94A3B8]">© 2026 ExamLogic</span>
        </div>
      </footer>
    </div>
  );
                  }
