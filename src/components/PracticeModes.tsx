"use client";

interface PracticeModesProps {
  loading?: boolean;
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

const MODE_CARD_STYLE: React.CSSProperties = {
  borderRadius: "14px",
  padding: "14px 16px",
  background:
    "linear-gradient(to bottom, #252260, #111A35 40%, #0A1020) padding-box, linear-gradient(to bottom, rgba(63,183,255,0.3), rgba(55,48,163,0.2)) border-box",
  border: "1px solid transparent",
  boxShadow: "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
  cursor: "pointer",
  display: "flex",
  flexDirection: "row" as const,
  alignItems: "center",
  gap: "14px",
};

interface Mode {
  title: string;
  description: string;
  accentColor: string;
  iconBg: string;
  icon: React.ReactNode;
}

const modes: Mode[] = [
  {
    title: "Quick Fire",
    description: "Rapid questions, sharp mind",
    accentColor: "#3FB7FF",
    iconBg: "rgba(63,183,255,0.12)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3FB7FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    title: "Campaign",
    description: "Progress through topics",
    accentColor: "#25d6a2",
    iconBg: "rgba(37,214,162,0.12)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#25d6a2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    title: "JAMB Simulation",
    description: "Full exam experience",
    accentColor: "#8B5CF6",
    iconBg: "rgba(139,92,246,0.12)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    title: "Sudden Death",
    description: "One wrong — game over",
    accentColor: "#F97316",
    iconBg: "rgba(249,115,22,0.12)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <path d="M8 14s-4 1-4 4h16c0-3-4-4-4-4" />
        <line x1="9" y1="11" x2="9.01" y2="11" />
        <line x1="15" y1="11" x2="15.01" y2="11" />
      </svg>
    ),
  },
];

export default function PracticeModes({ loading = false }: PracticeModesProps) {
  return (
    <div style={CARD_STYLE}>

      {/* Header */}
      <div style={{ fontSize: "clamp(14px, 4vw, 16px)", fontWeight: 700, color: "#D8E0E8", marginBottom: "16px" }}>
        Practice Modes
      </div>

      {/* Mode cards */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        opacity: loading ? 0.4 : 1,
        transition: "opacity 0.3s",
      }}>
        {modes.map((mode, i) => (
          <div key={i} style={MODE_CARD_STYLE}>

            {/* Icon */}
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: mode.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {mode.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "clamp(12px, 3.5vw, 14px)", fontWeight: 700, color: "#D8E0E8" }}>
                {mode.title}
              </div>
              <div style={{ fontSize: "clamp(10px, 2.8vw, 12px)", color: "#7D8A9A", marginTop: "3px" }}>
                {mode.description}
              </div>
            </div>

            {/* Button */}
            <div style={{ padding: "6px 12px", borderRadius: "8px", border: `1.5px solid ${mode.accentColor}`, background: "transparent", fontSize: "clamp(11px, 3vw, 13px)", fontWeight: 600, color: mode.accentColor, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer" }}>
              Start →
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
