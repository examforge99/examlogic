"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const PAGE_STYLE: React.CSSProperties = {
  minHeight: "100vh",
  background: "#071426",
  display: "flex",
  flexDirection: "column",
  padding: "24px 20px",
  maxWidth: "480px",
  margin: "0 auto",
};

const CARD_STYLE: React.CSSProperties = {
  borderRadius: "16px",
  padding: "20px",
  background:
    "linear-gradient(to bottom, #1E1B4B, #0F1535 30%, #080D1F) padding-box, linear-gradient(to bottom, #8B5CF6, #3730A3) border-box",
  border: "2px solid transparent",
  boxShadow: "0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
  marginBottom: "16px",
};

const RULE_ITEM_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  padding: "12px 0",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};

const BEGIN_BTN_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
  border: "none",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(139,92,246,0.35)",
  letterSpacing: "0.3px",
};

const DISABLED_BTN_STYLE: React.CSSProperties = {
  ...BEGIN_BTN_STYLE,
  background: "rgba(139,92,246,0.2)",
  color: "rgba(255,255,255,0.4)",
  cursor: "not-allowed",
  boxShadow: "none",
};

const rules = [
  {
    icon: "⏱",
    title: "120 Minutes",
    description: "You have exactly 120 minutes. The timer starts the moment you tap Begin.",
  },
  {
    icon: "📝",
    title: "180 Questions",
    description: "English Language (60) + 3 subjects (40 each) based on your JAMB combo.",
  },
  {
    icon: "🔀",
    title: "Navigate Freely",
    description: "Move between questions and change answers anytime before time runs out.",
  },
  {
    icon: "📡",
    title: "Stay Connected",
    description: "Your session requires an active connection. 90 seconds offline triggers auto-submit.",
  },
  {
    icon: "🚫",
    title: "One Session Rule",
    description: "You cannot start a new simulation while one is active.",
  },
  {
    icon: "📊",
    title: "Results",
    description: "Detailed results with per-subject breakdown are available immediately after submission.",
  },
];

type Stage = "preflight" | "generating" | "error";

export default function SimulationPreflightPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("preflight");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [checkingActive, setCheckingActive] = useState(true);

  // Check for existing active session on mount
  useEffect(() => {
    async function checkActive() {
      try {
        const res = await fetch("/api/simulation/session/active");
        const data = await res.json();
        if (data.session) {
          setActiveSession(data.session.id);
        }
      } catch {
        // ignore
      } finally {
        setCheckingActive(false);
      }
    }
    checkActive();
  }, []);

  const handleBegin = async () => {
    if (stage === "generating") return;

    // Resume existing session
    if (activeSession) {
      router.push(`/simulation/exam/${activeSession}`);
      return;
    }

    setStage("generating");

    try {
      // Step 1 — run pipeline, create session in pending state
      const res = await fetch("/api/simulation/start", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Failed to generate session. Please try again.");
        setStage("error");
        return;
      }

      const sessionId = data.data.session_id;

      // Step 2 — move session from pending → active
      const startRes = await fetch(`/api/simulation/session/${sessionId}/start`, {
        method: "POST",
      });

      if (!startRes.ok) {
        setErrorMessage("Failed to start session. Please try again.");
        setStage("error");
        return;
      }

      // Step 3 — navigate to exam page
      router.push(`/simulation/exam/${sessionId}`);

    } catch {
      setErrorMessage("Something went wrong. Check your connection and try again.");
      setStage("error");
    }
  };

  const isGenerating = stage === "generating";

  return (
    <div style={PAGE_STYLE}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <div
          onClick={() => router.back()}
          style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D8E0E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: "#D8E0E8" }}>JAMB Simulation</div>
          <div style={{ fontSize: "12px", color: "#7D8A9A", marginTop: "2px" }}>Full CBT Experience</div>
        </div>
      </div>

      {/* Active session banner */}
      {activeSession && (
        <div style={{ borderRadius: "12px", padding: "12px 16px", background: "rgba(37,214,162,0.08)", border: "1px solid rgba(37,214,162,0.3)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "16px" }}>⚡</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#25d6a2" }}>Active session found</div>
            <div style={{ fontSize: "11px", color: "#7D8A9A", marginTop: "2px" }}>Tap Begin to resume where you left off</div>
          </div>
        </div>
      )}

      {/* Rules card */}
      <div style={CARD_STYLE}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#8B5CF6", marginBottom: "4px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
          Before You Begin
        </div>
        <div style={{ fontSize: "12px", color: "#7D8A9A", marginBottom: "16px" }}>
          Read carefully — these rules apply during your exam
        </div>

        <div>
          {rules.map((rule, i) => (
            <div key={i} style={{ ...RULE_ITEM_STYLE, borderBottom: i === rules.length - 1 ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "20px", flexShrink: 0, marginTop: "1px" }}>{rule.icon}</div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#D8E0E8" }}>{rule.title}</div>
                <div style={{ fontSize: "12px", color: "#7D8A9A", marginTop: "3px", lineHeight: "1.5" }}>{rule.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {stage === "error" && (
        <div style={{ borderRadius: "12px", padding: "12px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", color: "#F87171" }}>{errorMessage}</div>
          <div
            onClick={() => setStage("preflight")}
            style={{ fontSize: "12px", color: "#8B5CF6", marginTop: "6px", cursor: "pointer", fontWeight: 600 }}
          >
            Try again →
          </div>
        </div>
      )}

      {/* Begin button */}
      <button
        onClick={handleBegin}
        disabled={isGenerating || checkingActive}
        style={isGenerating || checkingActive ? DISABLED_BTN_STYLE : BEGIN_BTN_STYLE}
      >
        {checkingActive
          ? "Checking..."
          : isGenerating
          ? "Generating your exam..."
          : activeSession
          ? "Resume Session →"
          : "I Understand — Begin Simulation"}
      </button>

      {/* Generating hint */}
      {isGenerating && (
        <div style={{ textAlign: "center", marginTop: "12px", fontSize: "12px", color: "#7D8A9A", lineHeight: "1.6" }}>
          Building your personalized 180-question exam.{"\n"}This takes a few seconds.
        </div>
      )}

    </div>
  );
}
