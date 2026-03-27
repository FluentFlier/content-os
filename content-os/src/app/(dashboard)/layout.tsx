import Sidebar from "@/components/Sidebar";
import BottomBar from "@/components/BottomBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="md:ml-60 min-h-screen p-4 md:p-6 pb-20 md:pb-6 overflow-y-auto">
        {children}
      </main>
      <BottomBar />
    </div>
  );
}
