// app/admin/templates/page.tsx

"use client";

import { useState, useEffect } from "react";

const CARD_STYLE: React.CSSProperties = {
  borderRadius: "12px",
  padding: "16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: "12px",
};

const BTN_STYLE: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "none",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const subjects = [
  { id: "96201fc7-9dd9-453d-918f-536d3a831534", name: "English" },
  { id: "286efeec-e17e-4695-a2a2-36d5e3e37204", name: "Mathematics" },
  { id: "f25a1b8e-39a0-47b1-b51a-0d0a1881b9e7", name: "Physics" },
  { id: "993c35c9-ab05-480d-b764-25de96fb5dbd", name: "Chemistry" },
  { id: "9fefdb9c-2bbe-4696-85bb-448815be6055", name: "Biology" },
  { id: "b466f464-7e68-40d2-9752-a8415f988cee", name: "Government" },
  { id: "f3778426-a92a-48a0-9b52-7eed8eb935df", name: "Economics" },
  { id: "100948eb-8476-4b77-a7b9-e0de53e7b955", name: "Literature" },
];

export default function AdminTemplates() {
  const [generating, setGenerating] = useState(false);
  const [refilling, setRefilling] = useState<string | null>(null);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  const handleGenerateAll = async () => {
    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_ids: subjects.map((s) => s.id) }),
      });
      const data = await res.json();
      setResult(res.ok ? { success: true } : { error: data.error });
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setGenerating(false);
    }
  };

  const handleRefill = async (type: string, payload: any) => {
    setRefilling(type);
    setResult(null);

    try {
      const res = await fetch("/api/admin/templates/refill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...payload }),
      });
      const data = await res.json();
      setResult(res.ok ? { success: true } : { error: data.error });
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setRefilling(null);
    }
  };

  return (
    <div>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#D8E0E8", marginBottom: "4px" }}>Templates</div>
      <div style={{ fontSize: "12px", color: "#7D8A9A", marginBottom: "20px" }}>Manage difficulty and topic template pools</div>

      {/* Generate all */}
      <div style={CARD_STYLE}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#D8E0E8", marginBottom: "6px" }}>Generate All Pools</div>
        <div style={{ fontSize: "12px", color: "#7D8A9A", marginBottom: "14px" }}>Seeds difficulty and topic templates from scratch for all subjects</div>
        <button
          onClick={handleGenerateAll}
          disabled={generating}
          style={{ ...BTN_STYLE, background: generating ? "rgba(37,214,162,0.15)" : "#25d6a2", color: generating ? "#7D8A9A" : "#071426" }}
        >
          {generating ? "Generating..." : "Generate All →"}
        </button>
      </div>

      {/* Difficulty refill */}
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#7D8A9A", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Difficulty Templates
      </div>

      {[40, 60].map((count) => (
        <div key={count} style={CARD_STYLE}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#D8E0E8" }}>{count}Q Templates</div>
              <div style={{ fontSize: "11px", color: "#7D8A9A", marginTop: "2px" }}>
                {count === 60 ? "English Language" : "Other subjects"}
              </div>
            </div>
            <button
              onClick={() => handleRefill("difficulty", { question_count: count })}
              disabled={refilling === `difficulty-${count}`}
              style={{ ...BTN_STYLE, background: "rgba(63,183,255,0.12)", color: "#3FB7FF", border: "1px solid rgba(63,183,255,0.3)" }}
            >
              {refilling === `difficulty-${count}` ? "Refilling..." : "Refill"}
            </button>
          </div>
        </div>
      ))}

      {/* Topic refill */}
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#7D8A9A", margin: "16px 0 10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Topic Templates
      </div>

      {subjects.map((s) => (
        <div key={s.id} style={CARD_STYLE}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#D8E0E8" }}>{s.name}</div>
            <button
              onClick={() => handleRefill("topic", { subject_id: s.id })}
              disabled={refilling === `topic-${s.id}`}
              style={{ ...BTN_STYLE, background: "rgba(139,92,246,0.12)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.3)" }}
            >
              {refilling === `topic-${s.id}` ? "Refilling..." : "Refill"}
            </button>
          </div>
        </div>
      ))}

      {/* Result */}
      {result?.success && (
        <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(37,214,162,0.08)", border: "1px solid rgba(37,214,162,0.3)", marginTop: "12px" }}>
          <div style={{ fontSize: "13px", color: "#25d6a2", fontWeight: 600 }}>✓ Done successfully</div>
        </div>
      )}
      {result?.error && (
        <div style={{ padding: "12px", borderRadius: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", marginTop: "12px" }}>
          <div style={{ fontSize: "13px", color: "#F87171" }}>{result.error}</div>
        </div>
      )}
    </div>
  );
}
