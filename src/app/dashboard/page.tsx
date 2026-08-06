// app/(dashboard)/dashboard/page.tsx
import MobileSidebar from "@/components/MobileSidebar";

export default function DashboardPage() {
  return (
    <div style={{ backgroundColor: "#071426" }} className="min-h-screen">
      <MobileSidebar />
      <main className="pt-2 px-4">
        {/* Dashboard content goes here */}
      </main>
    </div>
  );
}
