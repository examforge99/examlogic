"use client";

import { useState } from "react";
import Header from "@/components/dashboard/Header";
import PerformanceSection from "@/components/dashboard/PerformanceSection";
import PracticeSection from "@/components/dashboard/PracticeSection";
import LeaderboardPreview from "@/components/dashboard/LeaderboardPreview";
import BottomNav from "@/components/dashboard/BottomNav";
import { COLORS } from "@/lib/colors";
import { Subject } from "@/lib/performance";

const SUBJECTS: Subject[] = [
  { id: "math", label: "Mathematics", shortLabel: "Math", score: 72 },
  { id: "physics", label: "Physics", shortLabel: "Physics", score: 55 },
  { id: "chemistry", label: "Chemistry", shortLabel: "Chem", score: 38 },
  { id: "english", label: "English", shortLabel: "English", score: 81 },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <Header streak={14} userInitials="VE" />

      <main
        style={{
          padding: "18px 15px",
          paddingBottom: 100,
          maxWidth: 540,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <PerformanceSection subjects={SUBJECTS} />
        <PracticeSection onSelectMode={(id) => console.log("Selected mode:", id)} />
        <LeaderboardPreview onViewAll={() => console.log("View full leaderboard")} />
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
