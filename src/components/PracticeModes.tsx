"use client";

import { Zap, Map, BookOpen, Skull } from "lucide-react";

interface Mode {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  accentColor: string;
}

const modes: Mode[] = [
  {
    title: "Quick Fire",
    description: "Rapid questions, sharp mind",
    icon: <Zap size={22} color="#3FB7FF" />,
    iconBg: "rgba(63,183,255,0.12)",
    accentColor: "#3FB7FF",
  },
  {
    title: "Campaign",
    description: "Progress through topics",
    icon: <Map size={22} color="#25d6a2" />,
    iconBg: "rgba(37,214,162,0.12)",
    accentColor: "#25d6a2",
  },
  {
    title: "JAMB Simulation",
    description: "Full exam experience",
    icon: <BookOpen size={22} color="#8B5CF6" />,
    iconBg: "rgba(139,92,246,0.12)",
    accentColor: "#8B5CF6",
  },
  {
    title: "Sudden Death",
    description: "One wrong — game over",
    icon: <Skull size={22} color="#F97316" />,
    iconBg: "rgba(249,115,22,0.12)",
    accentColor: "#F97316",
  },
];

export default function PracticeModes() {
  return (
    <div style={{ padding: "0 24px" }}>
      <span style={{ fontSize: "16px", fontWeight: 700, color: "#D8E0E8", display: "block", marginBottom: "16px" }}>
        Practice Modes
      </span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {modes.map((mode, i) => (
          <div
            key={i}
            style={{
              borderRadius: "16px",
              padding: "20px",
              background:
                "linear-gradient(to bottom, #1E1B4B, #0F1535 30%, #080D1F) padding-box, linear-gradient(to bottom, #25d6a2, #3730A3) border-box",
              border: "2px solid transparent",
              boxShadow: "0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: mode.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {mode.icon}
            </div>

            {/* Text */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#D8E0E8" }}>
                {mode.title}
              </span>
              <span style={{ fontSize: "12px", color: "#7D8A9A" }}>
                {mode.description}
              </span>
            </div>

            {/* Start link */}
            <span style={{ fontSize: "12px", fontWeight: 600, color: mode.accentColor }}>
              Start →
            </span>
          </div>
        ))}
      </div>
    </div>
  );
            }
