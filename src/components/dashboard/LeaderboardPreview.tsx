import { motion } from "framer-motion";
import { Trophy, ChevronRight, Medal } from "lucide-react";
import { COLORS } from "@/lib/colors";

interface LeaderboardUser {
  rank: number;
  name: string;
  xp: number;
  avatar: string;
  badge: string;
}

const TOP_USERS: LeaderboardUser[] = [
  { rank: 1, name: "Chukwuemeka A.", xp: 14820, avatar: "CA", badge: "Legend" },
  { rank: 2, name: "Fatima O.", xp: 13475, avatar: "FO", badge: "Elite" },
  { rank: 3, name: "Babatunde S.", xp: 12990, avatar: "BS", badge: "Elite" },
];

const RANK_COLORS: Record<number, string> = {
  1: "#F59E0B",
  2: "#94A3B8",
  3: "#B45309",
};

interface LeaderboardPreviewProps {
  onViewAll?: () => void;
}

export default function LeaderboardPreview({ onViewAll }: LeaderboardPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: "20px 18px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.25), 0 0 40px -18px rgba(245,158,11,0.22)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Trophy size={15} color={COLORS.accent} strokeWidth={2} />
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, letterSpacing: "-0.01em" }}>
            Leaderboard
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={onViewAll}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.accent,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px 0",
          }}
        >
          View all
          <ChevronRight size={13} strokeWidth={2.5} />
        </motion.button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {TOP_USERS.map((user, i) => (
          <motion.div
            key={user.rank}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 + i * 0.07, duration: 0.3 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "9px 11px",
              borderRadius: 12,
              background: i === 0 ? "rgba(245,158,11,0.06)" : "transparent",
              border: i === 0 ? "1px solid rgba(245,158,11,0.18)" : "1px solid transparent",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: RANK_COLORS[user.rank],
                width: 18,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {user.rank === 1 ? <Medal size={15} color={RANK_COLORS[1]} /> : user.rank}
            </span>

            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: `${COLORS.accent}1A`,
                border: `1.5px solid ${COLORS.accent}2E`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 800,
                color: COLORS.accent,
                flexShrink: 0,
              }}
            >
              {user.avatar}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.name}
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>{user.badge}</div>
            </div>

            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.accent, whiteSpace: "nowrap" }}>
              {user.xp.toLocaleString()} XP
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
                }
