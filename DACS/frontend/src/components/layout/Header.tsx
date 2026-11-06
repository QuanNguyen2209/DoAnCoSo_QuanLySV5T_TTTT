"use client";

import { Menu, LogOut, KeyRound, X, Loader2 } from "lucide-react";
import api from "@/lib/axios";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";

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
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Đổi mật khẩu ──
  const [showPwModal, setShowPwModal] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const openPwModal = () => {
    setShowDropdown(false);
    setPw({ current: "", next: "", confirm: "" });
    setPwError("");
    setPwSuccess("");
    setShowPwModal(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    if (pw.next.length < 6) return setPwError("Mật khẩu mới phải có ít nhất 6 ký tự");
    if (pw.next !== pw.confirm) return setPwError("Mật khẩu xác nhận không khớp");
    setPwSaving(true);
    try {
      const res = await api.post("/auth/change-password", { currentPassword: pw.current, newPassword: pw.next });
      setPwSuccess(res.data.message || "Đổi mật khẩu thành công");
      setTimeout(() => setShowPwModal(false), 1500);
    } catch (err: any) {
      setPwError(err.response?.data?.error || "Không thể đổi mật khẩu");
    } finally {
      setPwSaving(false);
    }
  };

  // Đóng menu tài khoản khi bấm ra ngoài
  useEffect(() => {
    if (!showDropdown) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showDropdown]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Lấy chữ cái đầu cho avatar
  const initials = user?.ho_ten
    ? user.ho_ten.split(" ").pop()?.charAt(0).toUpperCase() || "U"
    : "U";

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-white shrink-0">
      <div className="flex items-center gap-6">
        {/* Nút mở menu trên điện thoại (trước đây không có tác dụng → mobile không điều hướng được) */}
        <button onClick={toggleSidebar} className="text-slate-500 hover:text-slate-700 lg:hidden font-bold" aria-label="Mở menu">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-5">
        {/* User Info + Dropdown */}
        <div className="relative" ref={dropdownRef}>
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
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.ho_ten} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-orange-200 flex items-center justify-center text-orange-600 font-bold text-sm">
                  {initials}
                </div>
              )}
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
                onClick={openPwModal}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                Đổi mật khẩu
              </button>
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

      {/* Modal đổi mật khẩu */}
      {showPwModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-center justify-center p-4" onClick={() => setShowPwModal(false)}>
          <form
            onSubmit={handleChangePassword}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Đổi mật khẩu</h2>
              <button type="button" onClick={() => setShowPwModal(false)} className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
                <X className="w-5 h-5" />
              </button>
            </div>
            {[
              { key: "current", label: "Mật khẩu hiện tại", auto: "current-password" },
              { key: "next", label: "Mật khẩu mới (tối thiểu 6 ký tự)", auto: "new-password" },
              { key: "confirm", label: "Nhập lại mật khẩu mới", auto: "new-password" },
            ].map((f) => (
              <label key={f.key} className="block">
                <span className="text-xs font-bold text-slate-500">{f.label}</span>
                <input
                  type="password"
                  required
                  autoComplete={f.auto}
                  value={(pw as any)[f.key]}
                  onChange={(e) => setPw({ ...pw, [f.key]: e.target.value })}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            ))}
            {pwError && <p className="text-sm font-medium text-rose-600">{pwError}</p>}
            {pwSuccess && <p className="text-sm font-medium text-emerald-600">{pwSuccess}</p>}
            <button
              type="submit"
              disabled={pwSaving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              {pwSaving && <Loader2 className="w-4 h-4 animate-spin" />} Lưu mật khẩu mới
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
