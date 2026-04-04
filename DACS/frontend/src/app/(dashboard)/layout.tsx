import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
        <Header />
        <main className="flex-1 overflow-y-auto bg-white border-t border-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}
