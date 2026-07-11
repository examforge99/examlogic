// app/admin/layout.tsx

"use client";

import { usePathname, useRouter } from "next/navigation";

const LAYOUT_STYLE: React.CSSProperties = {
  minHeight: "100vh",
  background: "#071426",
  display: "flex",
  flexDirection: "column",
};

const TOPBAR_STYLE: React.CSSProperties = {
  background: "linear-gradient(to bottom, #1E1B4B, #0F1535)",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const NAV_STYLE: React.CSSProperties = {
  background: "#0A0F1E",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  display: "flex",
  overflowX: "auto" as const,
  padding: "0 12px",
  gap: "4px",
};

const navItems = [
  { label: "Overview", path: "/admin" },
  { label: "Questions", path: "/admin/questions" },
  { label: "Templates", path: "/admin/templates" },
  { label: "Notifications", path: "/admin/notifications" },
  { label: "Bank Coverage", path: "/admin/bank" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div style={LAYOUT_STYLE}>
      {/* Topbar */}
      <div style={TOPBAR_STYLE}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#D8E0E8" }}>ExamLogic Admin</div>
          <div style={{ fontSize: "11px", color: "#7D8A9A", marginTop: "2px" }}>Management Console</div>
        </div>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#25d6a2", boxShadow: "0 0 8px #25d6a2" }} />
      </div>

      {/* Nav */}
      <div style={NAV_STYLE}>
        {navItems.map((item) => {
          const active = pathname === item.path;
          return (
            <div
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                padding: "12px 14px",
                fontSize: "13px",
                fontWeight: active ? 700 : 500,
                color: active ? "#25d6a2" : "#7D8A9A",
                borderBottom: active ? "2px solid #25d6a2" : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap" as const,
                transition: "all 0.2s",
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>

      {/* Page content */}
      <div style={{ flex: 1, padding: "20px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        {children}
      </div>
    </div>
  );
      }
