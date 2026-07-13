"use client";

import { useState, useRef, useEffect } from "react";
import { Flame, Bell, ChevronDown, User, History, Trophy, Settings, LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

interface NavbarProps {
  hasNotification?: boolean;
}

interface UserMeta {
  name: string;
  initials: string;
  streakCount: number;
  isAdmin: boolean;
}

export default function Navbar({ hasNotification = false }: NavbarProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user meta
  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          const name = d.user.username ?? d.user.email ?? "User";
          const initials = name
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
          setUserMeta({
            name,
            initials,
            streakCount: d.user.daily_streak_count ?? 0,
            isAdmin: d.user.role === "admin",
          });
        }
      })
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const menuItems = [
    {
      icon: <User size={14} />,
      label: "Profile",
      action: () => { router.push("/profile"); setDropdownOpen(false); },
    },
    {
      icon: <History size={14} />,
      label: "History",
      action: () => { router.push("/history"); setDropdownOpen(false); },
    },
    {
      icon: <Trophy size={14} />,
      label: "Leaderboard",
      action: () => { router.push("/leaderboard"); setDropdownOpen(false); },
    },
    {
      icon: <Settings size={14} />,
      label: "Settings",
      action: () => { router.push("/settings"); setDropdownOpen(false); },
    },
    ...(userMeta?.isAdmin ? [{
      icon: <Shield size={14} />,
      label: "Admin",
      action: () => { router.push("/admin"); setDropdownOpen(false); },
      accent: "#25d6a2",
    }] : []),
  ];

  const initials = userMeta?.initials ?? "··";
  const streakCount = userMeta?.streakCount ?? 0;
  const userName = userMeta?.name ?? "Loading...";
  const isAdmin = userMeta?.isAdmin ?? false;

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
        position: "relative",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #25d6a2, #3FB7FF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          </svg>
        </div>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#D8E0E8", letterSpacing: "-0.3px" }}>
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
              {userMeta ? streakCount : "—"}
            </span>
          </div>
          <span style={{ fontSize: "10px", color: "#7D8A9A" }}>Day Streak</span>
        </div>

        {/* Bell */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Bell size={16} color="#A8B2C1" />
          </div>
          {hasNotification && (
            <div style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#25d6a2",
              position: "absolute",
              top: "4px",
              right: "4px",
              border: "1.5px solid #0D1B2E",
            }} />
          )}
        </div>

        {/* Avatar + dropdown */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <div
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
          >
            <div style={{
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
              border: dropdownOpen ? "2px solid #3FB7FF" : "2px solid rgba(63,183,255,0.3)",
              flexShrink: 0,
              transition: "border 0.15s",
            }}>
              {initials}
            </div>
            <ChevronDown
              size={14}
              color="#7D8A9A"
              style={{
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              right: 0,
              width: "200px",
              background: "linear-gradient(to bottom, #1E1B4B, #080D1F)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              overflow: "hidden",
              zIndex: 100,
            }}>

              {/* User info */}
              <div style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#D8E0E8" }}>
                  {userName}
                </div>
                <div style={{ fontSize: "11px", color: "#7D8A9A", marginTop: "2px" }}>
                  {isAdmin ? "Admin" : "Student"}
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: "6px" }}>
                {menuItems.map((item, i) => (
                  <div
                    key={i}
                    onClick={item.action}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      color: (item as any).accent ?? "#A8B2C1",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Sign out */}
              <div style={{ padding: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div
                  onClick={() => signOut(() => router.push("/sign-in"))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: "#F87171",
                    fontSize: "13px",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "rgba(248,113,113,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <LogOut size={14} />
                  Sign Out
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </nav>
  );
              }
