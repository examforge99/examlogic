import Navbar from "@/components/dashboard/Navbar";
import StatCards from "@/components/dashboard/StatCards";
import PracticeModes from "@/components/dashboard/PracticeModes";
import ScoreDistribution from "@/components/dashboard/ScoreDistribution";
import RecentTests from "@/components/dashboard/RecentTests";

export default function DashboardPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#071426" }}>

      <Navbar />

      <main>
        <StatCards />
        <PracticeModes />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            padding: "24px",
          }}
        >
          <ScoreDistribution />
          <RecentTests />
        </div>
      </main>

    </div>
  );
}
