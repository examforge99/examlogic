// app/admin/notifications/page.tsx

"use client";

import { useEffect, useState } from "react";

const CARD_STYLE: React.CSSProperties = {
  borderRadius: "12px",
  padding: "16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: "12px",
};

const TYPE_COLORS: Record<string, string> = {
  excessive_resolution: "#F97316",
  generation_failure: "#F87171",
  suspicious_session: "#FBBF24",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#D8E0E8",
  fontSize: "12px",
  outline: "none",
  boxSizing: "border-box" as const,
  marginTop: "8px",
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleRespond = async (id: string) => {
    const message = messages[id];
    if (!message?.trim()) return;

    setSending(id);
    try {
      await fetch(`/api/admin/notifications/${id}/respond`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // ignore
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return (
      <div style={{ color: "#7D8A9A", fontSize: "13px", textAlign: "center", paddingTop: "40px" }}>
        Loading notifications...
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#D8E0E8", marginBottom: "4px" }}>Notifications</div>
      <div style={{ fontSize: "12px", color: "#7D8A9A", marginBottom: "20px" }}>
        {notifications.length} unresolved alert{notifications.length !== 1 ? "s" : ""}
      </div>

      {notifications.length === 0 && (
        <div style={{ ...CARD_STYLE, textAlign: "center" as const, padding: "32px" }}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>✓</div>
          <div style={{ fontSize: "13px", color: "#25d6a2", fontWeight: 600 }}>All clear</div>
          <div style={{ fontSize: "12px", color: "#7D8A9A", marginTop: "4px" }}>No unresolved alerts</div>
        </div>
      )}

      {notifications.map((n) => {
        const color = TYPE_COLORS[n.type] ?? "#7D8A9A";
        return (
          <div key={n.id} style={{ ...CARD_STYLE, borderColor: `${color}30` }}>
            {/* Type badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>
                {n.type.replace(/_/g, " ")}
              </div>
              <div style={{ fontSize: "11px", color: "#7D8A9A" }}>
                {new Date(n.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* User */}
            <div style={{ fontSize: "12px", color: "#7D8A9A", marginBottom: "6px" }}>
              User: <span style={{ color: "#D8E0E8" }}>{n.user_id}</span>
            </div>

            {/* Payload */}
            {n.payload && (
              <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", marginBottom: "10px" }}>
                {n.type === "suspicious_session" && (
                  <div style={{ fontSize: "12px", color: "#FBBF24" }}>
                    Absences: {n.payload.total_absence_events} — {n.payload.flag_reason?.replace(/_/g, " ")}
                  </div>
                )}
                {n.type === "excessive_resolution" && (
                  <div style={{ fontSize: "12px", color: "#F97316" }}>
                    Resolution count: {n.payload.resolutionCount}
                  </div>
                )}
                {n.type === "generation_failure" && (
                  <div style={{ fontSize: "12px", color: "#F87171" }}>
                    {n.payload.failureCause?.replace(/_/g, " ")}
                  </div>
                )}
              </div>
            )}

            {/* Response */}
            <textarea
              placeholder="Write compensation or resolution message..."
              value={messages[n.id] ?? ""}
              onChange={(e) => setMessages((prev) => ({ ...prev, [n.id]: e.target.value }))}
              rows={2}
              style={{ ...INPUT_STYLE, resize: "vertical" as const }}
            />
            <button
              onClick={() => handleRespond(n.id)}
              disabled={sending === n.id || !messages[n.id]?.trim()}
              style={{
                marginTop: "8px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                background: sending === n.id ? "rgba(37,214,162,0.15)" : "#25d6a2",
                color: sending === n.id ? "#7D8A9A" : "#071426",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {sending === n.id ? "Sending..." : "Resolve →"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
