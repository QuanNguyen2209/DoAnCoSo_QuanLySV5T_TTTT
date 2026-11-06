"use client";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-full bg-white">
          <Header />
          <main className="flex-1 overflow-y-auto bg-white border-t border-slate-100">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
