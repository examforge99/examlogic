import MobileSidebar from "@/components/MobileSidebar";
import { BottomNav } from "@/components/ui";

export default function DashboardPage() {
  return (
    <div style={{ backgroundColor: "#071426" }} className="min-h-screen">
      <MobileSidebar />
      <main className="pt-2 px-4 pb-24">
        {/* Dashboard content goes here */}
      </main>
      <BottomNav />
    </div>
  );
}
