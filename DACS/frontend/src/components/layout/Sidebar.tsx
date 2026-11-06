"use client";

import { Home, CheckSquare, FolderOpen, Settings, Shield, LayoutList, CheckCircle, BarChart3, School, User, UserCheck, Trophy, CalendarCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";

// Mục menu sáng khi đang ở đúng trang hoặc trang con (vd: /student/records/12)
const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUIStore();

  // Đóng menu trên điện thoại khi chuyển trang
  useEffect(() => { closeSidebar(); }, [pathname, closeSidebar]);

  const role = user?.role || 'sinh_vien';

  const isAdmin = role === 'admin';
  const isReviewer = role === 'can_bo';

  const studentMenu = [
    { name: "Trang chủ", icon: Home, href: "/" },
    { name: "Hồ sơ điện tử", icon: User, href: "/student/profile" },
    { name: "Đăng ký xét duyệt", icon: CheckSquare, href: "/student/register" },
    { name: "Hồ sơ của tôi", icon: FolderOpen, href: "/student/records" },
    { name: "Sự kiện", icon: CalendarCheck, href: "/student/events" },
    { name: "Vinh danh", icon: Trophy, href: "/honor-roll" },
  ];

  const reviewerMenu = [
    { name: "Trang chủ", icon: Home, href: "/" },
    { name: "Xét duyệt hồ sơ", icon: CheckCircle, href: "/reviewer/applications" },
    { name: "Thống kê đơn vị", icon: BarChart3, href: "/reviewer/statistics" },
    { name: "Vinh danh", icon: Trophy, href: "/honor-roll" },
  ];

  const adminMenu = [
    { name: "Trang chủ", icon: Home, href: "/" },
    { name: "Kỳ xét duyệt", icon: LayoutList, href: "/admin/periods" },
    { name: "Tiêu chí đánh giá", icon: Settings, href: "/admin/criteria" },
    { name: "Quản lý Lớp & Khoa", icon: School, href: "/admin/classes" },
    { name: "Phân công xét duyệt", icon: UserCheck, href: "/admin/assignments" },
    { name: "Quản lý hệ thống", icon: Shield, href: "/admin/system" },
    { name: "Thống kê hệ thống", icon: BarChart3, href: "/admin/statistics" },
    { name: "Quản lý Sự kiện", icon: CalendarCheck, href: "/admin/events" },
    { name: "Vinh danh", icon: Trophy, href: "/honor-roll" },
  ];

  const currentMenu = isAdmin ? adminMenu : isReviewer ? reviewerMenu : studentMenu;
  const menuLabel = isAdmin ? "Quản trị viên (Admin)" : isReviewer ? "Cán bộ Đoàn - Hội" : "Sinh viên & Lớp trưởng";

  return (
    <>
    {/* Lớp phủ khi mở menu trên điện thoại */}
    {sidebarOpen && (
      <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={closeSidebar} aria-hidden="true" />
    )}
    <aside
      className={`w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto
        fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
    >
      <div className="h-20 flex items-center justify-between px-8 border-b border-transparent sticky top-0 bg-white z-10 shrink-0">
        <div className="flex items-center gap-2 text-indigo-500 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          SV5T
        </div>
        <button onClick={closeSidebar} className="lg:hidden text-slate-400 hover:text-slate-700" aria-label="Đóng menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-6 py-4 flex-1 space-y-8">
        <div>
          <p className="text-[10px] font-bold text-slate-400 mb-4 px-4 tracking-wider uppercase">{menuLabel}</p>
          <nav className="space-y-1">
            {currentMenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive(pathname, item.href)
                    ? "bg-[#546fff] text-white shadow-md shadow-indigo-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive(pathname, item.href) ? "text-white" : "text-slate-400"}`} />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
    </>
  );
}
