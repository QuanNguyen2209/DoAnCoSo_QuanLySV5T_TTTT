"use client";

import { motion } from "framer-motion";
import { CheckSquare, Calendar, Loader2, ArrowRight, BookOpen, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import api from "@/lib/axios";

export default function StudentRegisterPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [loaiDoiTuong, setLoaiDoiTuong] = useState("individual");
  const [capXetDuyet, setCapXetDuyet] = useState("khoa");
  const [ghiChu, setGhiChu] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await api.get("/ky-xet-duyet");
        if (res.data.success) {
          // Chỉ lấy các kỳ xét duyệt đang mở
          const activePeriods = (res.data.data || []).filter((p: any) => p.trang_thai === "active");
          setPeriods(activePeriods);
          if (activePeriods.length > 0) {
            setSelectedPeriod(activePeriods[0].id);
          }
        }
      } catch (err) {
        console.error("Lỗi lấy kỳ xét duyệt", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPeriods();
  }, []);

  const handleRegister = async () => {
    if (!selectedPeriod) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await api.post("/ho-so", {
        sinh_vien_id: user?.id,
        ky_xet_duyet_id: selectedPeriod,
        loai_doi_tuong: loaiDoiTuong,
        ghi_chu_sv: ghiChu,
        cap_xet_duyet: capXetDuyet
      });

      if (res.data.success) {
        // Chuyển hướng đến trang chi tiết để nộp minh chứng
        router.push(`/student/records/${res.data.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Có lỗi xảy ra khi tạo hồ sơ");
      setSubmitting(false);
    }
  };

  const isLopTruong = user?.role === "lop_truong";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Đăng ký xét duyệt</h1>
        <p className="text-slate-500 font-medium mt-1">Chọn kỳ xét duyệt hiện hành và tạo bản nháp hồ sơ</p>
      </div>

      {periods.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center flex flex-col items-center">
          <Calendar className="w-12 h-12 text-amber-500 mb-4" />
          <h2 className="text-lg font-bold text-amber-900 mb-2">Chưa có kỳ xét duyệt nào đang mở</h2>
          <p className="text-amber-700">Hiện tại không có đợt xét duyệt Sinh viên 5 Tốt nào đang diễn ra. Vui lòng quay lại sau.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
          
          <div className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 text-rose-700 font-medium rounded-xl border border-rose-200">
                <AlertCircle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}

            {/* Chọn kỳ */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Chọn đợt xét duyệt</label>
              <div className="grid gap-3">
                {periods.map(period => (
                  <button key={period.id} onClick={() => setSelectedPeriod(period.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedPeriod === period.id 
                        ? "border-indigo-600 bg-indigo-50" 
                        : "border-slate-200 hover:border-indigo-300"
                    }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${
                      selectedPeriod === period.id ? "border-indigo-600" : "border-slate-300"
                    }`}>
                      {selectedPeriod === period.id && <div className="w-3 h-3 rounded-full bg-indigo-600" />}
                    </div>
                    <div>
                      <p className={`font-bold ${selectedPeriod === period.id ? "text-indigo-900" : "text-slate-900"}`}>
                        {period.ten_ky}
                      </p>
                      <p className="text-sm text-slate-500">Năm học: {period.nam_hoc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn loại danh hiệu */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Loại danh hiệu đăng ký</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={() => setLoaiDoiTuong("individual")}
                  className={`flex flex-col gap-2 p-5 rounded-2xl border-2 text-left transition-all ${
                    loaiDoiTuong === "individual" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Sinh viên 5 Tốt</span>
                    {loaiDoiTuong === "individual" && <CheckSquare className="w-5 h-5 text-indigo-600" />}
                  </div>
                  <p className="text-sm text-slate-500">Dành cho cá nhân sinh viên</p>
                </button>

                {isLopTruong ? (
                  <button onClick={() => setLoaiDoiTuong("collective")}
                    className={`flex flex-col gap-2 p-5 rounded-2xl border-2 text-left transition-all ${
                      loaiDoiTuong === "collective" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Tập thể Tiên tiến</span>
                      {loaiDoiTuong === "collective" && <CheckSquare className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <p className="text-sm text-slate-500">Nộp hồ sơ đại diện cho lớp</p>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-400">Tập thể Tiên tiến</span>
                    </div>
                    <p className="text-sm text-slate-400">Chỉ dành cho Lớp trưởng</p>
                  </div>
                )}
              </div>
            </div>

            {/* Chọn Cấp xét duyệt */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Cấp xét duyệt</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={() => setCapXetDuyet("khoa")}
                  className={`flex flex-col gap-2 p-5 rounded-2xl border-2 text-left transition-all ${
                    capXetDuyet === "khoa" ? "border-indigo-600 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Cấp Khoa</span>
                    {capXetDuyet === "khoa" && <CheckSquare className="w-5 h-5 text-indigo-600" />}
                  </div>
                  <p className="text-sm text-slate-500">Hồ sơ sẽ được xét duyệt ở cấp Khoa</p>
                </button>

                <button onClick={() => setCapXetDuyet("truong")}
                  className={`flex flex-col gap-2 p-5 rounded-2xl border-2 text-left transition-all ${
                    capXetDuyet === "truong" ? "border-rose-500 bg-rose-50" : "border-slate-200 hover:border-slate-300"
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Cấp Trường</span>
                    {capXetDuyet === "truong" && <CheckSquare className="w-5 h-5 text-rose-600" />}
                  </div>
                  <p className="text-sm text-slate-500">Hồ sơ sẽ được xét duyệt ở cấp Trường</p>
                </button>
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Ghi chú thêm (Tùy chọn)</label>
              <textarea 
                value={ghiChu} onChange={e => setGhiChu(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-4 text-sm font-medium focus:border-indigo-500 outline-none resize-none h-24 bg-slate-50 focus:bg-white transition-colors"
                placeholder="Ví dụ: Hồ sơ bổ sung học bổng..."
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={handleRegister} disabled={submitting || !selectedPeriod}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all">
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
                Tạo hồ sơ và Tải minh chứng
                {!submitting && <ArrowRight className="w-4 h-4 ml-1" />}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
