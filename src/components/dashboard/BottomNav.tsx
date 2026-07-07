import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, BookOpen, Trophy, BarChart2, User, LucideIcon } from "lucide-react";
import { COLORS } from "@/lib/colors";

interface NavTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

const NAV_TABS: NavTab[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "practice", label: "Practice", icon: BookOpen },
  { id: "leaderboard", label: "Leaders", icon: Trophy },
  { id: "insights", label: "Insights", icon: BarChart2 },
  { id: "profile", label: "Profile", icon: User },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10,22,40,0.94)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "8px 0 14px",
        zIndex: 50,
      }}
    >
      {NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.85 }}
            onClick={() => onTabChange(tab.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 10px",
              position: "relative",
              minWidth: 52,
            }}
          >
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  style={{
                    position: "absolute",
                    top: -6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 18,
                    height: 3,
                    borderRadius: 999,
                    background: COLORS.accent,
                    boxShadow: `0 0 8px ${COLORS.accent}`,
                  }}
                />
              )}
            </AnimatePresence>

            <Icon
              size={20}
              color={isActive ? COLORS.accent : COLORS.textMuted}
              strokeWidth={isActive ? 2.2 : 1.7}
              style={{ transition: "color 0.2s ease" }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? COLORS.accent : COLORS.textMuted,
                letterSpacing: "0.02em",
                transition: "color 0.2s ease",
              }}
            >
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
                      }
