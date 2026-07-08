import Navbar from "@/components/Navbar";
import ScoreDistribution from "@/components/ScoreDistribution";
import PracticeModes from "@/components/PracticeModes";
import RecentTests from "@/components/RecentTests";

export default function DashboardPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#071426" }}>

      <Navbar />

      <main style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <ScoreDistribution />
        <PracticeModes />
        <RecentTests />
      </main>

    </div>
  );
}
