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
    )}&backgroundColor=546fff,4338ca,312e81`;

  return (
    <div className="absolute right-6 top-6 bottom-6 w-full max-w-md z-30 pointer-events-auto flex flex-col">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 text-white shadow-2xl flex-1 flex flex-col justify-between overflow-y-auto">
        {/* Header with Close & Navigation */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Gương Mặt Tiêu Biểu</span>
            </div>
            <div className="flex items-center gap-2">
              {onPrev && (
                <button
                  onClick={onPrev}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Sinh viên trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Sinh viên tiếp theo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Profile Card */}
          <div className="flex flex-col items-center text-center mt-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-amber-400 p-1 shadow-lg shadow-amber-500/20 bg-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt={student.sinh_vien.ho_ten}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 rounded-full p-1.5 shadow-md">
                <Trophy className="w-4 h-4" />
              </div>
            </div>

            <h3 className="text-xl font-black text-white mt-4 leading-tight">
              {student.sinh_vien.ho_ten}
            </h3>
            <p className="text-xs text-amber-300 font-semibold mt-1">
              MSSV: {student.sinh_vien.ma_sv}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-300">
              {student.sinh_vien.lop && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  {student.sinh_vien.lop.ten_lop}
                </span>
              )}
              {student.sinh_vien.khoa && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  {student.sinh_vien.khoa.ten_khoa}
                </span>
              )}
            </div>

            <div className="mt-4 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              🏆 Đã vinh danh {student.so_lan_dat} lần đạt chuẩn Sinh viên 5 Tốt
            </div>
          </div>

          {/* List of achievements / records */}
          <div className="mt-6 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" />
              Kỳ xét duyệt & Hồ sơ đạt chuẩn
            </h4>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {student.ho_so_list.map((hs) => (
                <div
                  key={hs.id}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start justify-between gap-2"
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
                      <span className="text-indigo-300 font-medium capitalize">
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
                  <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                    <FileCheck2 className="w-3 h-3" />
                    {hs.so_minh_chung} minh chứng
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex gap-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Quay lại không gian 3D
          </button>
        </div>
      </div>
    </div>
  );
}
