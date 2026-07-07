import Navbar from "@/components/Navbar";
import PracticeModes from "@/components/PracticeModes";
import ScoreDistribution from "@/components/ScoreDistribution";
import RecentTests from "@/components/RecentTests";

export default function DashboardPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#071426" }}>

      <Navbar />

      <main>
    
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
