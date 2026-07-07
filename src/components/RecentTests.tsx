"use client";

import { FileText, Leaf, Sigma, ClipboardList } from "lucide-react";
import { ReactNode } from "react";

interface Test {
  id: string;
  title: string;
  date: string;
  subjects: string;
  score: number;
  icon: ReactNode;
  iconBg: string;
}

interface RecentTestsProps {
  tests?: Omit<Test, "icon" | "iconBg">[];
}

const iconMap = [
  { icon: <FileText size={18} color="#3FB7FF" />, iconBg: "rgba(63,183,255,0.12)" },
  { icon: <Leaf size={18} color="#25d6a2" />, iconBg: "rgba(37,214,162,0.12)" },
  { icon: <Sigma size={18} color="#EAB308" />, iconBg: "rgba(234,179,8,0.12)" },
  { icon: <ClipboardList size={18} color="#8B5CF6" />, iconBg: "rgba(139,92,246,0.12)" },
];

const defaultTests = [
  { id: "1", title: "JAMB Mock Test 12", date: "May 21, 2024", subjects: "Physics, Chemistry, Maths", score: 82 },
  { id: "2", title: "NEET Biology Practice Test", date: "May 20, 2024", subjects: "Biology", score: 74 },
  { id: "3", title: "JAMB Mock Test 11", date: "May 19, 2024", subjects: "Physics, Chemistry, Maths", score: 68 },
  { id: "4", title: "Full Syllabus Test 3", date: "May 18, 2024", subjects: "All Subjects", score: 91 },
];

function scoreColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#EAB308";
  return "#F97316";
}

export default function RecentTests({ tests = defaultTests }: RecentTestsProps) {
  return (
    <div
      style={{
        borderRadius: "16px",
        padding: "20px",
        background:
          "linear-gradient(to bottom, #1E1B4B, #0F1535 30%, #080D1F) padding-box, linear-gradient(to bottom, #25d6a2, #3730A3) border-box",
        border: "2px solid transparent",
        boxShadow: "0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#D8E0E8" }}>Recent Tests</span>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#3FB7FF", cursor: "pointer" }}>View All</span>
      </div>

      {/* Rows */}
      {tests.map((test, i) => {
        const { icon, iconBg } = iconMap[i % iconMap.length];
        return (
          <div
            key={test.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 0",
              borderBottom: i < tests.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#D8E0E8" }}>{test.title}</span>
              <span style={{ fontSize: "11px", color: "#7D8A9A" }}>{test.date} • {test.subjects}</span>
            </div>

            {/* Score */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: scoreColor(test.score) }}>{test.score}%</span>
              <span style={{ fontSize: "11px", color: "#7D8A9A" }}>Score</span>
            </div>
          </div>
        );
      })}
    </div>
  );
            }
