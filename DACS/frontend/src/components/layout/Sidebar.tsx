"use client";

import { Home, CheckSquare, FolderOpen, Edit3, Settings, Shield, LayoutList, CheckCircle, BarChart3, School, Users, User, UserCheck, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const role = user?.role || 'sinh_vien';

  const isAdmin = role === 'admin';
  const isReviewer = role === 'can_bo';
  const isStudent = role === 'sinh_vien' || role === 'lop_truong';

  const studentMenu = [
    { name: "Trang chủ", icon: Home, href: "/", active: pathname === "/" },
    { name: "Hồ sơ điện tử", icon: User, href: "/student/profile", active: pathname === "/student/profile" },
    { name: "Đăng ký xét duyệt", icon: CheckSquare, href: "/student/register", active: pathname === "/student/register" },
    { name: "Hồ sơ của tôi", icon: FolderOpen, href: "/student/records", active: pathname === "/student/records" },
    { name: "Vinh danh", icon: Trophy, href: "/honor-roll", active: pathname === "/honor-roll" },
  ];

  const reviewerMenu = [
    { name: "Trang chủ", icon: Home, href: "/", active: pathname === "/" },
    { name: "Xét duyệt hồ sơ", icon: CheckCircle, href: "/reviewer/applications", active: pathname === "/reviewer/applications" },
    { name: "Thống kê đơn vị", icon: BarChart3, href: "/reviewer/statistics", active: pathname === "/reviewer/statistics" },
    { name: "Vinh danh", icon: Trophy, href: "/honor-roll", active: pathname === "/honor-roll" },
  ];

  const adminMenu = [
    { name: "Trang chủ", icon: Home, href: "/", active: pathname === "/" },
    { name: "Kỳ xét duyệt", icon: LayoutList, href: "/admin/periods", active: pathname === "/admin/periods" },
    { name: "Tiêu chí đánh giá", icon: Settings, href: "/admin/criteria", active: pathname === "/admin/criteria" },
    { name: "Quản lý Lớp & Khoa", icon: School, href: "/admin/classes", active: pathname === "/admin/classes" },
    { name: "Phân công xét duyệt", icon: UserCheck, href: "/admin/assignments", active: pathname === "/admin/assignments" },
    { name: "Quản lý hệ thống", icon: Shield, href: "/admin/system", active: pathname === "/admin/system" },
    { name: "Thống kê hệ thống", icon: BarChart3, href: "/admin/statistics", active: pathname === "/admin/statistics" },
    { name: "Vinh danh", icon: Trophy, href: "/honor-roll", active: pathname === "/honor-roll" },
  ];

  const currentMenu = isAdmin ? adminMenu : isReviewer ? reviewerMenu : studentMenu;
  const menuLabel = isAdmin ? "Quản trị viên (Admin)" : isReviewer ? "Cán bộ Đoàn - Hội" : "Sinh viên & Lớp trưởng";

  return (
    <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 hidden lg:flex overflow-y-auto">
      <div className="h-20 flex items-center px-8 border-b border-transparent sticky top-0 bg-white z-10 shrink-0">
        <div className="flex items-center gap-2 text-indigo-500 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          SV5T
        </div>
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
                  item.active
                    ? "bg-[#546fff] text-white shadow-md shadow-indigo-100"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <item.icon className={`w-5 h-5 ${item.active ? "text-white" : "text-slate-400"}`} />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
}
