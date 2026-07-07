"use client";

import { Flame, Bell, ChevronDown } from "lucide-react";

interface NavbarProps {
  userName?: string;
  streakCount?: number;
  hasNotification?: boolean;
  avatarInitials?: string;
}

export default function Navbar({
  userName = "Victor",
  streakCount = 12,
  hasNotification = true,
  avatarInitials = "VI",
}: NavbarProps) {
  return (
    <nav
      style={{
        width: "100%",
        height: "60px",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#0D1B2E",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #25d6a2, #3FB7FF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          </svg>
        </div>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#D8E0E8",
            letterSpacing: "-0.3px",
          }}
        >
          Exam<span style={{ color: "#3FB7FF" }}>Logic</span>
        </span>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>

        {/* Streak */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Flame size={16} color="#F97316" fill="#F97316" />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#D8E0E8" }}>
              {streakCount}
            </span>
          </div>
          <span style={{ fontSize: "10px", color: "#7D8A9A" }}>Day Streak</span>
        </div>

        {/* Bell */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bell size={16} color="#A8B2C1" />
          </div>
          {hasNotification && (
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#25d6a2",
                position: "absolute",
                top: "4px",
                right: "4px",
                border: "1.5px solid #0D1B2E",
              }}
            />
          )}
        </div>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3FB7FF, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 700,
              color: "white",
              border: "2px solid rgba(63,183,255,0.3)",
              flexShrink: 0,
            }}
          >
            {avatarInitials}
          </div>
          <ChevronDown size={14} color="#7D8A9A" />
        </div>

      </div>
    </nav>
  );
        }
          
