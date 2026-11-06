"use client";

import { HonorStudentData } from "./HonorFrame3D";
import {
  Trophy,
  Award,
  GraduationCap,
  Building2,
  CalendarDays,
  X,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
} from "lucide-react";

interface HonorDetailModalProps {
  student: HonorStudentData | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function HonorDetailModal({
  student,
  onClose,
  onPrev,
  onNext,
}: HonorDetailModalProps) {
  if (!student) return null;

  const avatarUrl =
    student.sinh_vien.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      student.sinh_vien.ho_ten
    )}&backgroundColor=da251d,8b0000,c41a1a`;

  return (
    <div className="absolute right-6 top-6 bottom-6 w-full max-w-md z-30 pointer-events-auto flex flex-col">
      <div
        className="backdrop-blur-xl rounded-3xl p-6 text-white shadow-2xl flex-1 flex flex-col justify-between overflow-y-auto"
        style={{
          background: "rgba(8,2,0,0.92)",
          border: "1px solid rgba(218,37,29,0.45)",
          boxShadow: "0 0 32px rgba(218,37,29,0.15), 0 0 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* ── Dải màu đỏ-vàng trên cùng ── */}
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl overflow-hidden">
          <div className="h-full" style={{ background: "linear-gradient(90deg, #8b0a0a, #DA251D 30%, #FFCC00 50%, #DA251D 70%, #8b0a0a)" }} />
        </div>

        <div className="pt-1">
          {/* Header: Close & Navigation */}
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid rgba(218,37,29,0.3)" }}>
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest" style={{ color: "#FFCC00" }}>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>Gương Mặt Tiêu Biểu</span>
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex items-center gap-2">
              {onPrev && (
                <button
                  onClick={onPrev}
                  className="p-1.5 rounded-lg transition-colors text-slate-300 hover:text-white"
                  style={{ background: "rgba(218,37,29,0.15)", border: "1px solid rgba(218,37,29,0.35)" }}
                  title="Sinh viên trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-1.5 rounded-lg transition-colors text-slate-300 hover:text-white"
                  style={{ background: "rgba(218,37,29,0.15)", border: "1px solid rgba(218,37,29,0.35)" }}
                  title="Sinh viên tiếp theo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors text-slate-400"
                style={{ background: "rgba(60,10,10,0.5)", border: "1px solid rgba(218,37,29,0.3)" }}
                onMouseEnter={(e) => { (e.target as HTMLElement).closest("button")!.style.background = "rgba(218,37,29,0.3)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).closest("button")!.style.background = "rgba(60,10,10,0.5)"; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="flex flex-col items-center text-center mt-6">
            <div className="relative">
              {/* Vòng đỏ-vàng ngoài avatar */}
              <div
                className="w-28 h-28 rounded-full p-1 shadow-lg"
                style={{
                  background: "conic-gradient(#DA251D 0deg, #FFCC00 90deg, #DA251D 180deg, #FFCC00 270deg, #DA251D 360deg)",
                  boxShadow: "0 0 20px rgba(218,37,29,0.5)",
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden" style={{ background: "#0d0205" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt={student.sinh_vien.ho_ten}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Huy hiệu Trophy góc dưới */}
              <div
                className="absolute -bottom-2 -right-2 rounded-full p-1.5 shadow-md"
                style={{ background: "linear-gradient(135deg, #DA251D, #8b0000)" }}
              >
                <Trophy className="w-4 h-4 text-yellow-400" />
              </div>
            </div>

            <h3 className="text-xl font-black text-white mt-4 leading-tight tracking-wide">
              {student.sinh_vien.ho_ten}
            </h3>
            <p className="text-xs font-bold mt-1" style={{ color: "#FFCC00" }}>
              MSSV: {student.sinh_vien.ma_sv}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-300">
              {student.sinh_vien.lop && (
                <span
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(218,37,29,0.1)", border: "1px solid rgba(218,37,29,0.35)" }}
                >
                  <GraduationCap className="w-3.5 h-3.5" style={{ color: "#FFCC00" }} />
                  {student.sinh_vien.lop.ten_lop}
                </span>
              )}
              {student.sinh_vien.khoa && (
                <span
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(218,37,29,0.1)", border: "1px solid rgba(218,37,29,0.35)" }}
                >
                  <Building2 className="w-3.5 h-3.5" style={{ color: "#FFCC00" }} />
                  {student.sinh_vien.khoa.ten_khoa}
                </span>
              )}
            </div>

            {/* Badge vinh danh */}
            <div
              className="mt-4 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, rgba(218,37,29,0.2), rgba(139,10,10,0.3))",
                border: "1px solid rgba(255,204,0,0.5)",
                color: "#FFCC00",
              }}
            >
              <span style={{ fontSize: "1.1em" }}>🏆</span>
              Vinh danh {student.so_lan_dat} lần đạt chuẩn Sinh viên 5 Tốt
            </div>

            {/* Khẩu hiệu Đoàn */}
            <div
              className="mt-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
              style={{ background: "rgba(218,37,29,0.08)", color: "#ff9090", border: "1px solid rgba(218,37,29,0.2)" }}
            >
              🔴 Đoàn TNCS Hồ Chí Minh — HUTECH
            </div>
          </div>

          {/* Danh sách kỳ xét duyệt */}
          <div className="mt-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "#FFCC00" }}>
              <Award className="w-4 h-4" style={{ color: "#DA251D" }} />
              Kỳ xét duyệt &amp; Hồ sơ đạt chuẩn
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {student.ho_so_list.map((hs) => (
                <div
                  key={hs.id}
                  className="p-3 rounded-xl flex items-start justify-between gap-2"
                  style={{
                    background: "rgba(218,37,29,0.07)",
                    border: "1px solid rgba(218,37,29,0.25)",
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {hs.ky_xet_duyet?.ten_ky || "Kỳ xét duyệt"}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-slate-500" />
                        {hs.ky_xet_duyet?.nam_hoc || "—"}
                      </span>
                      <span>•</span>
                      <span className="font-medium" style={{ color: "#FFCC00" }}>
                        {hs.cap_xet_duyet === "truong"
                          ? "Cấp Trường"
                          : hs.cap_xet_duyet === "thanh"
                          ? "Cấp Thành phố"
                          : hs.cap_xet_duyet === "trung_uong"
                          ? "Cấp Trung ương"
                          : hs.cap_xet_duyet}
                      </span>
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1"
                    style={{
                      background: "rgba(218,37,29,0.12)",
                      border: "1px solid rgba(218,37,29,0.35)",
                      color: "#ffa0a0",
                    }}
                  >
                    <FileCheck2 className="w-3 h-3" />
                    {hs.so_minh_chung} minh chứng
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 flex gap-2" style={{ borderTop: "1px solid rgba(218,37,29,0.25)" }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: "rgba(218,37,29,0.12)",
              border: "1px solid rgba(218,37,29,0.4)",
              color: "#ffcccc",
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(218,37,29,0.25)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "rgba(218,37,29,0.12)"; }}
          >
            ← Quay lại không gian 3D
          </button>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Sparkles className="w-3 h-3" style={{ color: "#FFCC00" }} />
          <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "rgba(255,204,0,0.5)" }}>
            Đoàn Thanh Niên Cộng Sản Hồ Chí Minh
          </span>
          <Sparkles className="w-3 h-3" style={{ color: "#FFCC00" }} />
        </div>
      </div>
    </div>
  );
}
