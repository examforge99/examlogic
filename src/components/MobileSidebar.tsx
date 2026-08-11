// components/MobileSidebar.tsx
"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Monitor,
  BarChart2,
  Target,
  Zap,
  Trophy,
  Shield,
  Bookmark,
  Settings,
  X,
  Bell,
  Crown,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ReactNode;
  badge?: string;
  active?: boolean;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard size={20} />, active: true },
  { label: "Practice", icon: <BookOpen size={20} /> },
  { label: "Simulations", icon: <Monitor size={20} /> },
  { label: "Analytics", icon: <BarChart2 size={20} /> },
  { label: "Weak Areas", icon: <Target size={20} /> },
  { label: "Next Best Action", icon: <Zap size={20} />, badge: "NEW" },
  { label: "Leaderboard", icon: <Trophy size={20} /> },
  { label: "Badges", icon: <Shield size={20} /> },
  { label: "Bookmarks", icon: <Bookmark size={20} /> },
  { label: "Settings", icon: <Settings size={20} /> },
];

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");

  return (
    <>
      {/* Top Header Bar */}
      <header
        style={{ backgroundColor: "#071426" }}
        className="flex items-center justify-between px-4 py-3 border-b border-white/10"
      >
        {/* Hamburger */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex flex-col gap-[5px] p-1"
          aria-label="Open menu"
        >
          <span className="block w-5 h-[2px] bg-white rounded" />
          <span className="block w-5 h-[2px] bg-white rounded" />
          <span className="block w-3 h-[2px] bg-white rounded" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            style={{ backgroundColor: "#25d6a2" }}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
          >
            <BookOpen size={14} color="#071426" />
          </div>
          <span
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            className="text-white font-bold text-lg"
          >
            Exam<span style={{ color: "#25d6a2" }}>Logic</span>
          </span>
        </div>

        {/* Bell + Avatar */}
        <div className="flex items-center gap-3">
          <button className="relative" aria-label="Notifications">
            <Bell size={20} color="white" />
            <span
              style={{ backgroundColor: "#25d6a2" }}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-[#071426] flex items-center justify-center"
            >
              3
            </span>
          </button>
          <div
            style={{ backgroundColor: "#25d6a2" }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#071426] font-bold text-sm"
          >
            V
          </div>
        </div>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          backgroundColor: "#071426",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
        className="fixed top-0 left-0 h-full w-[78%] max-w-[300px] z-50 flex flex-col"
      >
        {/* Drawer Header */}
        <div
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          className="flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-2">
            <div
              style={{ backgroundColor: "#25d6a2" }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
            >
              <BookOpen size={16} color="#071426" />
            </div>
            <span
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-white font-bold text-xl"
            >
              Exam<span style={{ color: "#25d6a2" }}>Logic</span>
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="p-1"
          >
            <X size={20} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        {/* User Profile Strip */}
        <div
          style={{
            backgroundColor: "rgba(37,214,162,0.08)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
          className="flex items-center gap-3 px-5 py-4"
        >
          <div
            style={{ backgroundColor: "#25d6a2" }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#071426] font-bold"
          >
            V
          </div>
          <div>
            <p
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-white font-semibold text-sm"
            >
              Victor
            </p>
            <p className="text-white/40 text-xs">JAMB 2026 Candidate</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span style={{ color: "#f97316" }} className="text-sm">🔥</span>
            <span
              style={{ color: "#25d6a2", fontFamily: "'Space Grotesk', sans-serif" }}
              className="text-sm font-bold"
            >
              12
            </span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeItem === item.label;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveItem(item.label);
                  setIsOpen(false);
                }}
                style={{
                  backgroundColor: isActive
                    ? "rgba(37,214,162,0.12)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid #25d6a2"
                    : "3px solid transparent",
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-left transition-colors"
              >
                <span
                  style={{ color: isActive ? "#25d6a2" : "rgba(255,255,255,0.5)" }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "14px",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span
                    style={{
                      backgroundColor: "#3FB7FF",
                      color: "#071426",
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                    className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Go Premium Card */}
        <div className="px-4 pb-6">
          <div
            style={{
              background: "linear-gradient(135deg, #1a3a6b 0%, #0f2548 100%)",
              border: "1px solid rgba(63,183,255,0.2)",
            }}
            className="rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Crown size={16} color="#f59e0b" />
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: "#f59e0b",
                }}
                className="font-bold text-sm"
              >
                Go Premium
              </span>
            </div>
            <p className="text-white/50 text-xs mb-3 leading-relaxed">
              Unlock all question levels, unlimited practice, and detailed reports.
            </p>
            <button
              style={{
                backgroundColor: "#f59e0b",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              className="w-full py-2 rounded-lg text-[#071426] font-bold text-sm flex items-center justify-center gap-2"
            >
              Upgrade Now →
            </button>
          </div>
        </div>
      </div>
    </>
  );
        }
