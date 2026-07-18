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

  const rules = [
    {
      icon: <Zap size={28} color="#F97316" />,
      title: "Start At Your Level",
      description: "You begin exactly where your ability currently stands.",
    },
    {
      icon: <TrendingUp size={28} color="#F97316" />,
      title: "Climb As You Answer",
      description: "Correct answers push you toward harder, more rewarding questions.",
    },
    {
      icon: <Flame size={28} color="#F97316" />,
      title: "Build Your Streak",
      description: "Each level asks for a longer streak before you climb again.",
    },
    {
      icon: <Timer size={28} color="#F97316" />,
      title: "Stay Sharp",
      description: "Every question runs on the clock — harder ones give you more time.",
    },
    {
      icon: <Trophy size={28} color="#F97316" />,
      title: "Your Best Run Is Saved",
      description: "Track your peak level and streak on the leaderboard.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#071426", color: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 20px 16px" }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            color: "#fff",
          }}
        >
          ←
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Sudden Death</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            No limit · One chance
          </p>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            border: "1px solid rgba(249,115,22,0.25)",
            background: "linear-gradient(180deg, #3A1F0F 0%, #080D1F 100%)",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: "#F97316", margin: "0 0 8px" }}>
            HOW FAR CAN YOU GO?
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 0 20px", lineHeight: 1.5 }}>
            Every correct answer takes you higher. Every level unlocks a harder
            challenge. This is your moment to find your ceiling.
          </p>

          <div>
            {rules.map((rule, index) => (
              <div key={rule.title}>
                <Rule icon={rule.icon} title={rule.title} description={rule.description} />
                {index < rules.length - 1 && (
                  <div
                    style={{
                      height: 1,
                      background: "rgba(255,255,255,0.08)",
                      margin: "18px 0",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: "20px 0 0" }}>
            Prove to yourself how far your preparation has taken you.
          </p>
        </div>

        {error && (
          <p style={{ fontSize: 14, color: "#f87171", marginTop: 16, textAlign: "center" }}>
            {error}
          </p>
        )}
      </div>

      <div style={{ padding: "32px 20px" }}>
        <button
          onClick={handleStart}
          disabled={loading}
          style={{
            width: "100%",
            padding: "16px 0",
            borderRadius: "9999px",
            fontWeight: 600,
            fontSize: 16,
            color: "#fff",
            border: "none",
            background: "linear-gradient(90deg, #F97316 0%, #DC2626 100%)",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Starting..." : "Start Climbing"}
        </button>
      </div>
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
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ fontWeight: 600, fontSize: 15, margin: "0 0 4px", color: "#fff" }}>{title}</p>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.4 }}>
          {description}
        </p>
      </div>
    </div>
  );
            }
