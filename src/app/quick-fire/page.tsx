// app/quick-fire/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Timer, Target, Calculator } from "lucide-react";

export default function QuickFirePreflight() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions/quick-fire/start", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to start Quick Fire.");
        setLoading(false);
        return;
      }

      router.push(`/quick-fire/${data.session_id}/test`);
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
          <h1 className="text-lg font-semibold">Quick Fire</h1>
          <p className="text-sm text-white/50">20 Questions · 15 Minutes</p>
        </div>
      </header>

      <main className="flex-1 px-5">
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: "linear-gradient(180deg, #1E1B4B 0%, #080D1F 100%)",
            borderColor: "#3FB7FF33",
          }}
        >
          <p className="text-sm font-semibold tracking-wide text-[#3FB7FF] mb-1">
            THIS IS A SPRINT
          </p>
          <p className="text-white/70 text-sm mb-6">
            Answer fast, answer smart. Time keeps moving — it doesn't stop for anyone.
          </p>

          <div className="space-y-4">
            <Rule
              icon={<Zap size={20} className="text-[#3FB7FF]" />}
              title="20 Questions"
              description="Drawn from your registered subjects, matched to your current level."
            />
            <Rule
              icon={<Timer size={20} className="text-[#3FB7FF]" />}
              title="The Clock Runs"
              description="Total time depends on the questions you get. It never pauses."
            />
            <Rule
              icon={<Target size={20} className="text-[#3FB7FF]" />}
              title="Every Answer Counts"
              description="Your accuracy shapes your next challenge."
            />
            <Rule
              icon={<Calculator size={20} className="text-[#3FB7FF]" />}
              title="Calculator & Navigator"
              description="Both available throughout the session."
            />
          </div>
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
            background: "linear-gradient(90deg, #3FB7FF 0%, #6366F1 100%)",
          }}
        >
          {loading ? "Starting..." : "Let's Go — Start Quick Fire"}
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
