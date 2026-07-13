// components/dashboard/LeaderboardPreview.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  total_points: number;
  current_rank_tier: string;
  is_current_user: boolean;
}

const CARD_STYLE: React.CSSProperties = {
  width: "100%",
  borderRadius: "16px",
  padding: "20px",
  background:
    "linear-gradient(to bottom, #1E1B4B, #0F1535 30%, #080D1F) padding-box, linear-gradient(to bottom, #F97316, #3730A3) border-box",
  border: "2px solid transparent",
  boxShadow: "0 20px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
};

const TIER_COLORS: Record<string, string> = {
  legend: "#F97316",
  master: "#8B5CF6",
  expert: "#3FB7FF",
  advanced: "#25d6a2",
  intermediate: "#FBBF24",
  beginner: "#9CA3AF",
  unranked: "#4B5563",
};

const RANK_ICONS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export default function LeaderboardPreview({
  loading = false,
}: {
  loading?: boolean;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [fetching, setFetching] = useState(true);
  const [currentUserEntry, setCurrentUserEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    fetch("/api/leaderboard/preview")
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.top ?? []);
        setCurrentUserEntry(d.currentUser ?? null);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const isLoading = loading || fetching;

  return (
    <div style={CARD_STYLE}>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px",
      }}>
        <div style={{ fontSize: "clamp(14px, 4vw, 16px)", fontWeight: 700, color: "#D8E0E8" }}>
          Leaderboard
        </div>
        <div
          onClick={() => router.push("/leaderboard")}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#F97316",
            cursor: "pointer",
          }}
        >
          View All →
        </div>
      </div>

      {/* List */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        opacity: isLoading ? 0.4 : 1,
        transition: "opacity 0.3s",
      }}>

        {isLoading && (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                height: "48px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.04)",
              }} />
            ))}
          </>
        )}

        {!isLoading && entries.length === 0 && (
          <div style={{ textAlign: "center" as const, padding: "20px", color: "#7D8A9A", fontSize: "13px" }}>
            No entries yet
          </div>
        )}

        {!isLoading && entries.map((entry) => (
          <LeaderboardRow key={entry.user_id} entry={entry} />
        ))}

        {/* Divider + current user if not in top 5 */}
        {!isLoading && currentUserEntry && !entries.find((e) => e.is_current_user) && (
          <>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: "4px 0",
            }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ fontSize: "10px", color: "#4B5563" }}>your rank</div>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            </div>
            <LeaderboardRow entry={currentUserEntry} highlight />
          </>
        )}

      </div>

    </div>
  );
}

function LeaderboardRow({
  entry,
  highlight = false,
}: {
  entry: LeaderboardEntry;
  highlight?: boolean;
}) {
  const tierColor = TIER_COLORS[entry.current_rank_tier] ?? "#4B5563";
  const rankIcon = RANK_ICONS[entry.rank];
  const isCurrentUser = entry.is_current_user;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "10px 12px",
      borderRadius: "10px",
      background: isCurrentUser
        ? "rgba(249,115,22,0.08)"
        : highlight
        ? "rgba(255,255,255,0.03)"
        : "rgba(255,255,255,0.02)",
      border: `1px solid ${isCurrentUser ? "rgba(249,115,22,0.25)" : "rgba(255,255,255,0.04)"}`,
      transition: "background 0.15s",
    }}>

      {/* Rank */}
      <div style={{
        width: "28px",
        textAlign: "center" as const,
        fontSize: rankIcon ? "16px" : "13px",
        fontWeight: 700,
        color: rankIcon ? undefined : "#7D8A9A",
        flexShrink: 0,
      }}>
        {rankIcon ?? `#${entry.rank}`}
      </div>

      {/* Avatar initial */}
      <div style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${tierColor}40, ${tierColor}20)`,
        border: `1.5px solid ${tierColor}50`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: 700,
        color: tierColor,
        flexShrink: 0,
      }}>
        {entry.username?.[0]?.toUpperCase() ?? "?"}
      </div>

      {/* Name + tier */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "13px",
          fontWeight: isCurrentUser ? 700 : 600,
          color: isCurrentUser ? "#F97316" : "#D8E0E8",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap" as const,
        }}>
          {isCurrentUser ? "You" : entry.username}
        </div>
        <div style={{
          fontSize: "11px",
          color: tierColor,
          marginTop: "1px",
          textTransform: "capitalize" as const,
        }}>
          {entry.current_rank_tier}
        </div>
      </div>

      {/* Points */}
      <div style={{
        fontSize: "13px",
        fontWeight: 700,
        color: "#D8E0E8",
        flexShrink: 0,
      }}>
        {entry.total_points.toLocaleString()}
        <span style={{ fontSize: "10px", color: "#7D8A9A", fontWeight: 400, marginLeft: "2px" }}>pts</span>
      </div>

    </div>
  );
}
