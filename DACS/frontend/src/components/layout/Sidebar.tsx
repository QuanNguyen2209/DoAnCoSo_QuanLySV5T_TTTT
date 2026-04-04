"use client";

import { Home, CheckSquare, FolderOpen, Edit3, Settings, Shield, LayoutList, CheckCircle, BarChart3, School, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const studentMenu = [
    { name: "Trang chủ", icon: Home, href: "/", active: pathname === "/" },
    { name: "Đăng ký xét duyệt", icon: CheckSquare, href: "/student/register", active: pathname === "/student/register" },
    { name: "Hồ sơ của tôi", icon: FolderOpen, href: "/student/records", active: pathname === "/student/records" },
  ];

  const reviewerMenu = [
    { name: "Xét duyệt hồ sơ", icon: CheckCircle, href: "/reviewer/applications", active: pathname === "/reviewer/applications" },
    { name: "Thống kê đơn vị", icon: BarChart3, href: "/reviewer/statistics", active: pathname === "/reviewer/statistics" },
  ];

  const adminMenu = [
    { name: "Kỳ xét duyệt", icon: LayoutList, href: "/admin/periods", active: pathname === "/admin/periods" },
    { name: "Tiêu chí đánh giá", icon: Settings, href: "/admin/criteria", active: pathname === "/admin/criteria" },
    { name: "Quản lý Lớp & Khoa", icon: School, href: "/admin/classes", active: pathname === "/admin/classes" },
    { name: "Quản lý hệ thống", icon: Shield, href: "/admin/system", active: pathname === "/admin/system" },
    { name: "Thống kê hệ thống", icon: BarChart3, href: "/admin/statistics", active: pathname === "/admin/statistics" },
  ];

  return (
    <aside className="w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 hidden lg:flex overflow-y-auto">
      <div className="h-20 flex items-center px-8 border-b border-transparent sticky top-0 bg-white z-10 shrink-0">
        <div className="flex items-center gap-2 text-indigo-500 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          Logo
        </div>
      </div>

      <div className="px-6 py-4 flex-1 space-y-8">
        {/* Sinh viên & Lớp trưởng */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 mb-4 px-4 tracking-wider uppercase">Sinh viên & Lớp trưởng</p>
          <nav className="space-y-1">
            {studentMenu.map((item) => (
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

        {/* Cán bộ Đoàn Hội */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 mb-4 px-4 tracking-wider uppercase">Cán bộ Đoàn - Hội</p>
          <nav className="space-y-1">
            {reviewerMenu.map((item) => (
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

        {/* Quản trị viên */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 mb-4 px-4 tracking-wider uppercase">Quản trị viên (Admin)</p>
          <nav className="space-y-1">
            {adminMenu.map((item) => (
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
