"use client";

import { Menu, Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

const roleLabels: Record<string, string> = {
  sinh_vien: "Sinh viên",
  lop_truong: "Lớp trưởng",
  can_bo: "Cán bộ Đoàn - Hội",
  admin: "Quản trị viên",
};

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Lấy chữ cái đầu cho avatar
  const initials = user?.ho_ten
    ? user.ho_ten.split(" ").pop()?.charAt(0).toUpperCase() || "U"
    : "U";

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white shrink-0">
      <div className="flex items-center gap-6">
        <button className="text-slate-500 hover:text-slate-700 lg:hidden font-bold">
          <Menu className="w-5 h-5" />
        </button>
        <button className="text-slate-500 hover:text-slate-700">
          <Search className="w-5 h-5" />
        </button>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400 ml-2">
          <button className="flex items-center gap-1 hover:text-slate-800 transition-colors">
            Apps <ChevronDown className="w-4 h-4" />
          </button>
          <button className="hover:text-slate-800 transition-colors font-semibold">Chat</button>
          <button className="hover:text-slate-800 transition-colors font-semibold">Calendar</button>
          <button className="hover:text-slate-800 transition-colors font-semibold">Email</button>
        </nav>
      </div>

      <div className="flex items-center gap-5">
        <button className="text-slate-400 hover:text-slate-700 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Info + Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-2 border-l border-slate-100 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{user?.ho_ten || "Người dùng"}</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {roleLabels[user?.role || "sinh_vien"] || "Sinh viên"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-orange-100 overflow-hidden border border-orange-200">
              <div className="w-full h-full bg-orange-200 flex items-center justify-center text-orange-600 font-bold text-sm">
                {initials}
              </div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 top-14 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900 truncate">{user?.ho_ten}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
