// app/admin/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const CARD_STYLE: React.CSSProperties = {
  borderRadius: "14px",
  padding: "16px",
  background: "linear-gradient(to bottom, #1E1B4B, #080D1F) padding-box, linear-gradient(to bottom, rgba(37,214,162,0.3), rgba(55,48,163,0.2)) border-box",
  border: "1px solid transparent",
  marginBottom: "12px",
};

const STAT_CARD: React.CSSProperties = {
  borderRadius: "12px",
  padding: "14px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  flex: 1,
};

export default function AdminOverview() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [notifRes, bankRes] = await Promise.all([
          fetch("/api/admin/notifications"),
          fetch("/api/admin/bank/coverage"),
        ]);
        const notif = await notifRes.json();
        const bank = await bankRes.json();
        setStats({ notif, bank });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const shortcuts = [
    { label: "Add Questions", accent: "#3FB7FF", path: "/admin/questions" },
    { label: "Refill Templates", accent: "#25d6a2", path: "/admin/templates" },
    { label: "Review Alerts", accent: "#F97316", path: "/admin/notifications" },
    { label: "Bank Coverage", accent: "#8B5CF6", path: "/admin/bank" },
  ];

  return (
    <div>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#D8E0E8", marginBottom: "4px" }}>Overview</div>
      <div style={{ fontSize: "12px", color: "#7D8A9A", marginBottom: "20px" }}>ExamLogic system status</div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <div style={STAT_CARD}>
          <div style={{ fontSize: "11px", color: "#7D8A9A", marginBottom: "6px" }}>Unresolved Alerts</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: loading ? "#7D8A9A" : "#F97316" }}>
            {loading ? "—" : stats?.notif?.notifications?.length ?? 0}
          </div>
        </div>
        <div style={STAT_CARD}>
          <div style={{ fontSize: "11px", color: "#7D8A9A", marginBottom: "6px" }}>Topics Below Min</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: loading ? "#7D8A9A" : "#F87171" }}>
            {loading ? "—" : stats?.bank?.below_threshold ?? 0}
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div style={{ fontSize: "13px", fontWeight: 600, color: "#7D8A9A", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        Quick Actions
      </div>

      {shortcuts.map((s, i) => (
        <div key={i} style={CARD_STYLE} onClick={() => router.push(s.path)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: s.accent }}>{s.label}</div>
            <div style={{ fontSize: "16px", color: s.accent }}>→</div>
          </div>
        </div>
      ))}
    </div>
  );
  }
