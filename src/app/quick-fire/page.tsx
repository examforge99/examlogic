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

  const rules = [
    {
      icon: <Zap size={28} color="#3FB7FF" />,
      title: "20 Questions",
      description: "Drawn from your registered subjects, matched to your current level.",
    },
    {
      icon: <Timer size={28} color="#3FB7FF" />,
      title: "The Clock Runs",
      description: "Total time depends on the questions you get. It never pauses.",
    },
    {
      icon: <Target size={28} color="#3FB7FF" />,
      title: "Every Answer Counts",
      description: "Your accuracy shapes your next challenge.",
    },
    {
      icon: <Calculator size={28} color="#3FB7FF" />,
      title: "Calculator & Navigator",
      description: "Both available throughout the session.",
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
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Quick Fire</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            20 Questions · 15 Minutes
          </p>
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            borderRadius: 16,
            padding: 24,
            border: "1px solid rgba(63,183,255,0.25)",
            background: "linear-gradient(180deg, #14224A 0%, #080D1F 100%)",
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: "#3FB7FF", margin: "0 0 8px" }}>
            THIS IS A SPRINT
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", margin: "0 0 20px", lineHeight: 1.5 }}>
            Answer fast, answer smart. Time keeps moving — it doesn't stop for anyone.
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
            borderRadius: "14px",
            fontWeight: 600,
            fontSize: 16,
            color: "#fff",
            border: "none",
            background: "linear-gradient(90deg, #3FB7FF 0%, #2E8FD9 100%)",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Starting..." : "Let's Go — Start Quick Fire"}
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
