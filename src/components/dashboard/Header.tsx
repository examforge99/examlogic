import { motion } from "framer-motion";
import { Flame, Bell } from "lucide-react";
import { COLORS } from "@/lib/colors";

interface HeaderProps {
  streak?: number;
  userInitials?: string;
}

export default function Header({ streak = 0, userInitials = "VE" }: HeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "15px 18px",
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(10,22,40,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="27" height="27" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill={COLORS.accent} fillOpacity="0.13" />
          <path
            d="M8 14C8 10.686 10.686 8 14 8C17.314 8 20 10.686 20 14"
            stroke={COLORS.accent}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="14" cy="14" r="2.5" fill={COLORS.accent} />
          <path d="M14 11.5V8" stroke={COLORS.accent} strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: COLORS.textPrimary,
            letterSpacing: "-0.03em",
          }}
        >
          ExamLogic
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "rgba(245,158,11,0.11)",
            border: "1px solid rgba(245,158,11,0.24)",
            borderRadius: 20,
            padding: "5px 9px",
          }}
        >
          <Flame size={13} color="#F59E0B" strokeWidth={2.5} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B" }}>{streak}</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.88 }}
          style={{
            width: 35,
            height: 35,
            borderRadius: 11,
            background: COLORS.surfaceRaised,
            border: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <Bell size={15} color={COLORS.textSecondary} strokeWidth={1.8} />
          <div
            style={{
              position: "absolute",
              top: 7,
              right: 7,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: COLORS.accent,
              border: `1.5px solid ${COLORS.bg}`,
            }}
          />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.88 }}
          style={{
            width: 35,
            height: 35,
            borderRadius: "50%",
            background: `${COLORS.accent}1F`,
            border: `2px solid ${COLORS.accent}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 800,
            color: COLORS.accent,
          }}
        >
          {userInitials}
        </motion.button>
      </div>
    </header>
  );
            }
