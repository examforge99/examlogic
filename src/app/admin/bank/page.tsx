// app/admin/bank/page.tsx

"use client";

import { useEffect, useState } from "react";

const CARD_STYLE: React.CSSProperties = {
  borderRadius: "12px",
  padding: "14px 16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const subjectNames: Record<string, string> = {
  "96201fc7-9dd9-453d-918f-536d3a831534": "English",
  "286efeec-e17e-4695-a2a2-36d5e3e37204": "Mathematics",
  "f25a1b8e-39a0-47b1-b51a-0d0a1881b9e7": "Physics",
  "993c35c9-ab05-480d-b764-25de96fb5dbd": "Chemistry",
  "9fefdb9c-2bbe-4696-85bb-448815be6055": "Biology",
  "b466f464-7e68-40d2-9752-a8415f988cee": "Government",
  "f3778426-a92a-48a0-9b52-7eed8eb935df": "Economics",
  "100948eb-8476-4b77-a7b9-e0de53e7b955": "Literature",
};

export default function AdminBankCoverage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/bank/coverage")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ color: "#7D8A9A", fontSize: "13px", textAlign: "center", paddingTop: "40px" }}>
        Loading coverage report...
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#D8E0E8", marginBottom: "4px" }}>Bank Coverage</div>
      <div style={{ fontSize: "12px", color: "#7D8A9A", marginBottom: "20px" }}>Topics below minimum question threshold</div>

      {/* Summary */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {[
          { label: "Total Topics", value: data?.total_topics ?? 0, color: "#3FB7FF" },
          { label: "Below Min", value: data?.below_threshold ?? 0, color: "#F87171" },
          { label: "Min Required", value: data?.minimum_required ?? 10, color: "#7D8A9A" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, borderRadius: "10px", padding: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" as const }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: "#7D8A9A", marginTop: "4px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gap list */}
      {data?.gaps?.length === 0 && (
        <div style={{ textAlign: "center" as const, padding: "32px", color: "#25d6a2", fontSize: "13px" }}>
          ✓ All topics meet minimum threshold
        </div>
      )}

      {(data?.gaps ?? []).map((topic: any) => (
        <div key={topic.id} style={CARD_STYLE}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#D8E0E8" }}>{topic.name}</div>
            <div style={{ fontSize: "11px", color: "#7D8A9A", marginTop: "2px" }}>
              {subjectNames[topic.subject_id] ?? topic.subject_id}
            </div>
          </div>
          <div style={{ textAlign: "right" as const }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#F87171" }}>{topic.question_count}</div>
            <div style={{ fontSize: "10px", color: "#7D8A9A" }}>questions</div>
          </div>
        </div>
      ))}
    </div>
  );
            }
