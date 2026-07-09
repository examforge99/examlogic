"use client";

import { FileText, Leaf, Sigma, ClipboardList } from "lucide-react";
import { ReactNode } from "react";

interface Test {
  id: string;
  title: string;
  date: string;
  subjects: string;
  score: number;
}

interface RecentTestsProps {
  tests?: Test[];
  loading?: boolean;
}

const iconMap: { icon: ReactNode; iconBg: string }[] = [
  { icon: <FileText size={18} color="#3FB7FF" />, iconBg: "rgba(63,183,255,0.12)" },
  { icon: <Leaf size={18} color="#25d6a2" />, iconBg: "rgba(37,214,162,0.12)" },
  { icon: <Sigma size={18} color="#EAB308" />, iconBg: "rgba(234,179,8,0.12)" },
  { icon: <ClipboardList size={18} color="#8B5CF6" />, iconBg: "rgba(139,92,246,0.12)" },
];

const defaultTests: Test[] = [
  { id: "1", title: "JAMB Mock Test 12", date: "May 21, 2024", subjects: "Physics, Chemistry, Maths", score: 82 },
  { id: "2", title: "NEET Biology Practice Test", date: "May 20, 2024", subjects: "Biology", score: 74 },
  { id: "3", title: "JAMB Mock Test 11", date: "May 19, 2024", subjects: "Physics, Chemistry, Maths", score: 68 },
  { id: "4", title: "Full Syllabus Test 3", date: "May 18, 2024", subjects: "All Subjects", score: 91 },
];

const skeletonTests = Array.from({ length: 4 }, (_, i) => ({ id: String(i) }));

function scoreColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#EAB308";
  return "#F97316";
}

const CARD_STYLE: React.CSSProperties = {
  width: "100%",
  borderRadius: "16px",
  padding: "20px",
  background:
    "linear-gradient(to bottom, #1E1B4B, #0F1535 30%, #080D1F) padding-box, linear-gradient(to bottom, #25d6a2, #3730A3) border-box",
  border: "2px solid transparent",
  boxShadow: "0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
};

export default function RecentTests({ tests, loading = false }: RecentTestsProps) {
  const isEmpty = !loading && (tests ?? []).length === 0;
  const displayTests = loading ? defaultTests : (tests ?? []);

  return (
    <div style={CARD_STYLE}>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px",
        opacity: loading ? 0.5 : 1,
        transition: "opacity 0.3s",
      }}>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#D8E0E8" }}>Recent Tests</span>
        {!isEmpty && (
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#3FB7FF", cursor: "pointer" }}>
            View All
          </span>
        )}
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 0",
          gap: "10px",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <p style={{
            fontSize: "13px",
            color: "#7D8A9A",
            textAlign: "center",
            margin: 0,
            lineHeight: 1.6,
          }}>
            No sessions yet. Start a practice session to see your test history here.
          </p>
        </div>
      ) : (
        /* Rows */
        <div style={{ opacity: loading ? 0.4 : 1, transition: "opacity 0.3s" }}>
          {displayTests.map((test, i) => {
            const { icon, iconBg } = iconMap[i % iconMap.length];
            return (
              <div
                key={test.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 0",
                  borderBottom: i < displayTests.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#D8E0E8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {test.title}
                  </span>
                  <span style={{ fontSize: "11px", color: "#7D8A9A" }}>
                    {test.date} • {test.subjects}
                  </span>
                </div>

                {/* Score */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
                  <span style={{ fontSize: "16px", fontWeight: 700, color: scoreColor(test.score) }}>
                    {test.score}%
                  </span>
                  <span style={{ fontSize: "11px", color: "#7D8A9A" }}>Score</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
