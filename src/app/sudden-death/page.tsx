// app/sudden-death/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, TrendingUp, Flame, Timer, Trophy } from "lucide-react";

export default function SuddenDeathPreflight() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions/sudden-death/start", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to start Sudden Death.");
        setLoading(false);
        return;
      }

      router.push(`/sudden-death/${data.session_id}/challenge`);
    } catch {
      setError("Something went wrong. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#071426] text-white flex flex-col">
      <header className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
        >
          ←
        </button>
        <div>
          <h1 className="text-lg font-semibold">Sudden Death</h1>
          <p className="text-sm text-white/50">No limit · One chance</p>
        </div>
      </header>

      <main className="flex-1 px-5">
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: "linear-gradient(180deg, #1E1B4B 0%, #080D1F 100%)",
            borderColor: "#25d6a233",
          }}
        >
          <p className="text-sm font-semibold tracking-wide text-[#25d6a2] mb-1">
            HOW FAR CAN YOU GO?
          </p>
          <p className="text-white/70 text-sm mb-6">
            Every correct answer takes you higher. Every level unlocks a harder
            challenge. This is your moment to find your ceiling.
          </p>

          <div className="space-y-4">
            <Rule
              icon={<Zap size={20} className="text-[#25d6a2]" />}
              title="Start At Your Level"
              description="You begin exactly where your ability currently stands."
            />
            <Rule
              icon={<TrendingUp size={20} className="text-[#25d6a2]" />}
              title="Climb As You Answer"
              description="Correct answers push you toward harder, more rewarding questions."
            />
            <Rule
              icon={<Flame size={20} className="text-[#25d6a2]" />}
              title="Build Your Streak"
              description="Each level asks for a longer streak before you climb again."
            />
            <Rule
              icon={<Timer size={20} className="text-[#25d6a2]" />}
              title="Stay Sharp"
              description="Every question runs on the clock — harder ones give you more time."
            />
            <Rule
              icon={<Trophy size={20} className="text-[#25d6a2]" />}
              title="Your Best Run Is Saved"
              description="Track your peak level and streak on the leaderboard."
            />
          </div>

          <p className="text-white/50 text-sm mt-6">
            Prove to yourself how far your preparation has taken you.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-400 mt-4 text-center">{error}</p>
        )}
      </main>

      <footer className="px-5 pb-8 pt-4">
        <button
          onClick={handleStart}
          disabled={loading}
          className="w-full py-4 rounded-full font-semibold text-white disabled:opacity-60"
          style={{
            background: "linear-gradient(90deg, #25d6a2 0%, #3FB7FF 100%)",
          }}
        >
          {loading ? "Starting..." : "Start Climbing"}
        </button>
      </footer>
    </div>
  );
}

function Rule({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="font-semibold text-sm text-white">{title}</p>
        <p className="text-sm text-white/60">{description}</p>
      </div>
    </div>
  );
}
