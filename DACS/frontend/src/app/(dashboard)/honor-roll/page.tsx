"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Star, Search, Filter, Download, Upload, Loader2,
  GraduationCap, Building2, CalendarDays, Award, X, Eye, Users,
  Sparkles, Image as ImageIcon, ChevronDown, Globe, Lock, ToggleLeft, ToggleRight
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/axios";
import { useAuthStore } from "@/lib/authStore";

interface HonorStudent {
  sinh_vien: {
    id: number; ho_ten: string; ma_sv: string; email: string; avatar_url: string | null;
    lop: { id: number; ma_lop: string; ten_lop: string } | null;
    khoa: { id: number; ma_khoa: string; ten_khoa: string } | null;
  };
  so_lan_dat: number;
  ho_so_list: {
    id: number; ma_ho_so: string; loai_doi_tuong: string; ngay_duyet: string;
    cap_xet_duyet: string; ky_xet_duyet: { id: number; ten_ky: string; nam_hoc: string; loai: string } | null;
    so_minh_chung: number;
  }[];
}

interface HonorStats {
  tong_sv_vinh_danh: number; tong_ho_so_approved: number; so_khoa: number;
  theo_ky: { ky_xet_duyet_id: number; ten_ky: string; nam_hoc: string; so_luong: number }[];
}

export default function HonorRollPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [students, setStudents] = useState<HonorStudent[]>([]);
  const [stats, setStats] = useState<HonorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kyFilter, setKyFilter] = useState("all");
  const [khoaFilter, setKhoaFilter] = useState("all");
  const [periods, setPeriods] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Poster state
  const [posterTemplate, setPosterTemplate] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<HonorStudent | null>(null);
  const [showPosterPreview, setShowPosterPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Publish config state
  const [published, setPublished] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Gallery poster data URLs (dành cho sinh viên)
  const [posterDataUrls, setPosterDataUrls] = useState<Record<number, string>>({});
  const [generatingAll, setGeneratingAll] = useState(false);

  // Fetch config (published status) + poster template khi trang load
  useEffect(() => {
    // Lấy trạng thái công bố
    api.get("/vinh-danh/config").then(res => {
      setPublished(res.data.data?.published || false);
    }).catch(() => {}).finally(() => setConfigLoading(false));

    // Lấy URL poster template (dùng cho cả admin lẫn sinh viên)
    api.get("/vinh-danh/poster-template").then(res => {
      const url = res.data.data?.publicUrl || res.data.data?.url || null;
      if (url) setPosterTemplate(url);
    }).catch(() => {});
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const params: any = {};
        if (kyFilter !== "all") params.ky_xet_duyet_id = kyFilter;
        if (khoaFilter !== "all") params.khoa_id = khoaFilter;
        if (search) params.search = search;

        const [honorRes, statsRes, periodsRes, khoaRes] = await Promise.all([
          api.get("/vinh-danh", { params }),
          api.get("/vinh-danh/stats"),
          api.get("/ky-xet-duyet"),
          api.get("/khoa"),
        ]);

        setStudents(honorRes.data.data || []);
        setStats(statsRes.data.data || null);
        setPeriods(periodsRes.data.data || []);
        setDepartments(khoaRes.data.data || []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu vinh danh:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [kyFilter, khoaFilter, search]);

  // Tự động tạo poster cho tất cả sinh viên (dùng renderStudentPoster chung)
  useEffect(() => {
    if (isAdmin || !posterTemplate || students.length === 0 || !published) {
      console.log("[PosterGallery] Bỏ qua:", { isAdmin, hasTpl: !!posterTemplate, count: students.length, published });
      return;
    }

    let cancelled = false;
    setGeneratingAll(true);
    console.log("[PosterGallery] Bắt đầu tạo poster cho", students.length, "sinh viên...");

    const generateAll = async () => {
      const urls: Record<number, string> = {};
      const tplUrl = posterTemplate.includes("?") ? posterTemplate : `${posterTemplate}?t=${Date.now()}`;

      let templateImg: HTMLImageElement;
      try {
        templateImg = await loadImage(tplUrl);
        console.log("[PosterGallery] Template loaded:", templateImg.width, "x", templateImg.height);
      } catch (err) {
        console.error("[PosterGallery] Không load được template:", err);
        setGeneratingAll(false);
        return;
      }

      for (const student of students) {
        if (cancelled) break;
        try {
          const canvas = document.createElement("canvas");
          await renderStudentPoster(canvas, templateImg, student);
          urls[student.sinh_vien.id] = canvas.toDataURL("image/png");
          console.log("[PosterGallery] ✓", student.sinh_vien.ho_ten);
        } catch (err) {
          console.error("[PosterGallery] Lỗi SV:", student.sinh_vien.ho_ten, err);
        }
      }
      if (!cancelled) {
        console.log("[PosterGallery] Hoàn thành:", Object.keys(urls).length, "poster");
        setPosterDataUrls(urls);
        setGeneratingAll(false);
      }
    };

    generateAll();
    return () => { cancelled = true; };
  }, [isAdmin, posterTemplate, students, published]);


  // Toggle publish (admin only)
  const handleTogglePublish = async () => {
    setToggling(true);
    try {
      const res = await api.put("/vinh-danh/config", { published: !published });
      setPublished(res.data.data.published);
    } catch (err) {
      console.error("Lỗi toggle publish:", err);
      alert("Không thể thay đổi trạng thái vinh danh.");
    } finally {
      setToggling(false);
    }
  };

  // Fetch poster template
  useEffect(() => {
    if (!isAdmin) return;
    api.get("/vinh-danh/poster-template").then(res => {
      if (res.data.data?.url) setPosterTemplate(res.data.data.url);
    }).catch(() => {});
  }, [isAdmin]);

  // Upload poster template
  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("[Upload] Đang upload file:", file.name, file.size, "bytes");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/vinh-danh/poster-template", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("[Upload] Thành công:", res.data);
      setPosterTemplate(res.data.data.publicUrl);
    } catch (err: any) {
      console.error("Upload lỗi:", err?.response?.data || err);
      alert(`Không thể upload mẫu poster: ${err?.response?.data?.error || err.message}`);
    } finally {
      setUploading(false);
      // Reset input để có thể upload lại cùng file
      e.target.value = "";
    }
  };



  // Generate poster on Canvas (dùng hàm chung renderStudentPoster)
  const generatePoster = useCallback(async (student: HonorStudent, download = false) => {
    if (!posterTemplate || !canvasRef.current) return;
    const canvas = canvasRef.current;

    setPosterLoading(true);
    try {
      const tplUrl = posterTemplate.includes("?") ? posterTemplate : `${posterTemplate}?t=${Date.now()}`;
      const templateImg = await loadImage(tplUrl);
      await renderStudentPoster(canvas, templateImg, student);

      if (download) {
        const link = document.createElement("a");
        link.download = `poster_${student.sinh_vien.ma_sv || student.sinh_vien.id}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } catch (err) {
      console.error("Lỗi tạo poster:", err);
    } finally {
      setPosterLoading(false);
    }
  }, [posterTemplate]);


  // Preview poster for a student
  const handlePreviewPoster = async (student: HonorStudent) => {
    setSelectedStudent(student);
    setShowPosterPreview(true);
    // Wait for modal to render, then generate
    setTimeout(() => generatePoster(student), 100);
  };

  const handleDownloadPoster = () => {
    if (selectedStudent) generatePoster(selectedStudent, true);
  };

  // Initials helper
  const getInitials = (name: string) => name.split(" ").map(w => w[0]).join("").slice(-2).toUpperCase();

  if (loading || configLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  // Chỉ sinh viên thường mới bị khóa khi chưa công bố
  if (!isAdmin && !published) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Lock className="w-20 h-20 text-slate-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-700 mb-3">Vinh Danh chưa được công bố</h2>
          <p className="text-slate-500 max-w-md">Admin chưa công bố bảng vinh danh cho kỳ này. Vui lòng quay lại sau!</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1400px] mx-auto">
      {/* ───── BANNER ───── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-8 md:p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 30%, #fbbf24 60%, #f59e0b 100%)" }}>
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} animate={{ y: [-10, 10, -10], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
              className="absolute text-4xl"
              style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}>⭐</motion.div>
          ))}
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-14 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Trophy className="w-7 h-7 text-amber-800" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-amber-900 tracking-tight">Vinh Danh Sinh Viên</h1>
                <p className="text-amber-800/80 font-medium mt-0.5">Tôn vinh những tấm gương xuất sắc đạt danh hiệu Sinh viên 5 Tốt</p>
              </div>
            </div>
            {/* Không có badge phụ cho roles khác */}
          </div>
          {/* Stats mini */}
          {stats && (
            <div className="flex gap-4">
              {[
                { label: "SV Vinh danh", value: stats.tong_sv_vinh_danh, icon: Users },
                { label: "Hồ sơ đạt", value: stats.tong_ho_so_approved, icon: Award },
                { label: "Khoa", value: stats.so_khoa, icon: Building2 },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="bg-white/30 backdrop-blur-sm rounded-2xl px-5 py-3 text-center min-w-[100px]">
                  <s.icon className="w-5 h-5 text-amber-800 mx-auto mb-1" />
                  <div className="text-2xl font-black text-amber-900">{s.value}</div>
                  <div className="text-xs font-bold text-amber-800/70">{s.label}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
      {/* ───── MANAGEMENT BAR (chỉ admin) ───── */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border-2 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            published
              ? "bg-emerald-50 border-emerald-300"
              : "bg-rose-50 border-rose-300"
          }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              published ? "bg-emerald-100" : "bg-rose-100"
            }`}>
              {published
                ? <Globe className="w-6 h-6 text-emerald-600" />
                : <Lock className="w-6 h-6 text-rose-500" />}
            </div>
            <div>
              <p className={`font-bold text-base ${
                published ? "text-emerald-800" : "text-rose-700"
              }`}>
                {published ? "✅ Bảng Vinh Danh đang được công bố" : "🔒 Bảng Vinh Danh chưa được công bố"}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {published
                  ? "Tất cả sinh viên đều có thể xem bảng vinh danh."
                  : students.length === 0
                    ? "Chưa có hồ sơ nào được duyệt. Duyệt hồ sơ trước để công bố."
                    : `Có ${students.length} sinh viên chờ được công bố. Nhấn nút để hiển thị.`
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleTogglePublish}
            disabled={toggling || students.length === 0}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md shrink-0 ${
              published
                ? "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700"
                : "bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}>
            {toggling
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : published
                ? <ToggleRight className="w-5 h-5" />
                : <ToggleLeft className="w-5 h-5" />}
            {published ? "Đang Công bố — Nhấn để Ẩn" : "Công bố Vinh Danh"}
          </button>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Tìm sinh viên (tên, MSSV)..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all" />
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={kyFilter} onChange={e => setKyFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer">
            <option value="all">Tất cả kỳ</option>
            {periods.map((p: any) => (
              <option key={p.id} value={p.id}>{p.ten_ky}</option>
            ))}
          </select>
          <select value={khoaFilter} onChange={e => setKhoaFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer">
            <option value="all">Tất cả khoa</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.ten_khoa}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ───── POSTER TEMPLATE (chỉ admin) ───── */}
      {isAdmin && students.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Mẫu Poster Vinh Danh</h2>
              <p className="text-sm text-slate-500">Upload mẫu poster → hệ thống sẽ tự ghép ảnh + thông tin SV</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Upload area */}
            <label className="flex-1 border-2 border-dashed border-indigo-300 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all min-h-[200px]">
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadTemplate} />
              {uploading ? (
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-indigo-400 mb-3" />
                  <span className="text-sm font-bold text-indigo-600">Nhấn để upload mẫu poster</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG — Khuyến nghị 1080×1920</span>
                </>
              )}
            </label>
            {/* Preview */}
            {posterTemplate && (
              <div className="w-[200px] shrink-0">
                <p className="text-xs font-bold text-slate-500 mb-2">Mẫu hiện tại:</p>
                <img src={posterTemplate} alt="Poster template" className="w-full rounded-xl border border-slate-200 shadow-sm" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ───── STUDENT GRID: Admin xem card, Sinh viên xem poster gallery ───── */}
      {students.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 bg-white border border-slate-200 rounded-3xl">
          <Sparkles className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có sinh viên nào được vinh danh</h3>
          <p className="text-sm text-slate-500">Sinh viên sẽ xuất hiện ở đây khi hồ sơ được phê duyệt.</p>
        </motion.div>
      ) : isAdmin ? (
        /* ── Admin: Card list với nút quản lý ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((s, i) => (
            <motion.div key={s.sinh_vien.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="group bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              {s.so_lan_dat >= 2 && (
                <div className="absolute top-0 right-0 w-20 h-20">
                  <div className="absolute top-3 right-[-20px] bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] font-black px-6 py-1 rotate-45 shadow-md">
                    ⭐ {s.so_lan_dat}x
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  {s.sinh_vien.avatar_url ? (
                    <img src={s.sinh_vien.avatar_url} alt={s.sinh_vien.ho_ten}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-700 font-bold text-lg border-2 border-amber-200">
                      {getInitials(s.sinh_vien.ho_ten)}
                    </div>
                  )}
                  {s.so_lan_dat >= 2 && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow">
                      {s.so_lan_dat}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-base truncate">{s.sinh_vien.ho_ten}</h3>
                  <p className="text-xs text-slate-500 font-medium">MSSV: {s.sinh_vien.ma_sv || "—"}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200">
                      {s.sinh_vien.lop?.ten_lop || "—"}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg border border-blue-200">
                      {s.sinh_vien.khoa?.ten_khoa || "—"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {s.ho_so_list.map((hs) => (
                  <div key={hs.id} className="flex items-center gap-2 text-xs bg-slate-50 rounded-xl px-3 py-2">
                    <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-slate-700 font-medium truncate flex-1">{hs.ky_xet_duyet?.ten_ky || hs.ma_ho_so}</span>
                    <span className="text-slate-400 shrink-0">{hs.so_minh_chung} MC</span>
                  </div>
                ))}
              </div>
              {isAdmin && posterTemplate && (
                <button onClick={() => handlePreviewPoster(s)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-sm font-bold rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all shadow-sm">
                  <Eye className="w-4 h-4" /> Tạo Poster
                </button>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        /* ── Sinh viên: Poster Gallery ── */
        generatingAll ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
            <p className="text-slate-500 font-medium">Đang tạo poster vinh danh...</p>
          </div>
        ) : posterTemplate && Object.keys(posterDataUrls).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {students.map((s, i) => {
              const posterUrl = posterDataUrls[s.sinh_vien.id];
              return posterUrl ? (
                <motion.div key={s.sinh_vien.id}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="group cursor-pointer relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                  onClick={() => { setSelectedStudent(s); setShowPosterPreview(true); setTimeout(() => generatePoster(s), 100); }}>
                  <img src={posterUrl} alt={s.sinh_vien.ho_ten} className="w-full h-auto block" />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-4 px-3">
                    <p className="text-white font-bold text-sm text-center leading-tight">{s.sinh_vien.ho_ten}</p>
                    <p className="text-amber-300 text-xs mt-1">🏆 {s.so_lan_dat} lần vinh danh</p>
                  </div>
                  {/* Badge số lần */}
                  {s.so_lan_dat >= 2 && (
                    <div className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                      ⭐ {s.so_lan_dat}x
                    </div>
                  )}
                </motion.div>
              ) : null;
            })}
          </div>
        ) : (
          /* Fallback: chưa có template → hiện danh sách đơn giản */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {students.map((s, i) => (
              <motion.div key={s.sinh_vien.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-gradient-to-b from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 text-center shadow-sm">
                {s.sinh_vien.avatar_url ? (
                  <img src={s.sinh_vien.avatar_url} alt={s.sinh_vien.ho_ten}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-4 border-amber-300 shadow" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-black text-2xl mx-auto mb-3 border-4 border-amber-300">
                    {getInitials(s.sinh_vien.ho_ten)}
                  </div>
                )}
                <p className="font-bold text-slate-800 text-sm leading-tight">{s.sinh_vien.ho_ten}</p>
                <p className="text-xs text-slate-500 mt-1">🏆 {s.so_lan_dat} lần vinh danh</p>
                <p className="text-[10px] text-amber-700 font-semibold mt-1">{s.sinh_vien.lop?.ten_lop || ""}</p>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* ───── POSTER PREVIEW MODAL ───── */}
      <AnimatePresence>
        {showPosterPreview && selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPosterPreview(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Poster — {selectedStudent.sinh_vien.ho_ten}
                </h3>
                <button onClick={() => setShowPosterPreview(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex justify-center">
                {posterLoading ? (
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin my-12" />
                ) : (
                  <canvas ref={canvasRef} className="max-w-full max-h-[60vh] rounded-xl shadow-md" />
                )}
              </div>
              <button onClick={handleDownloadPoster}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md">
                <Download className="w-5 h-5" /> Tải Poster PNG
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden canvas for poster generation */}
      {!showPosterPreview && <canvas ref={canvasRef} className="hidden" />}
    </div>
  );
}
// ─────────────────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────

/** Load image as Promise with CORS */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Vẽ text với viền outline rõ nét (không dùng shadow blur mờ) */
function drawTextOutline(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillColor: string,
  outlineColor = "rgba(0,0,0,0.8)",
  outlineWidth = 4
) {
  ctx.save();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  // Vẽ outline
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = outlineWidth;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeText(text, x, y);
  // Vẽ fill
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Wrap text dài thành nhiều dòng */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * HÀM RENDER POSTER CHÍNH (dùng chung cho admin preview + student gallery)
 * 
 * @param canvas   - Canvas element (hoặc off-screen canvas)
 * @param template - HTMLImageElement đã load xong
 * @param student  - Dữ liệu sinh viên
 * @returns Promise<void>
 * 
 * ┌──────────────────────────────┐
 * │   VINH DANH SINH VIÊN 5 TỐT │   0%–18%
 * │                              │
 * │         ┌──────────┐         │
 * │         │  AVATAR  │         │   22%–55% (tâm ~38%)
 * │         └──────────┘         │
 * │                              │
 * │      ─── Tên SV ───          │   58%–62%
 * │      ╔══════════════╗        │
 * │      ║  MSSV/Lớp    ║        │   65%–75%
 * │      ╚══════════════╝        │
 * │      🏆 x lần vinh danh     │   77%–82%
 * │      ⭐⭐⭐                 │   85%–95%
 * └──────────────────────────────┘
 */
async function renderStudentPoster(
  canvas: HTMLCanvasElement,
  template: HTMLImageElement,
  student: HonorStudent
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = template.width;
  canvas.height = template.height;
  ctx.drawImage(template, 0, 0);

  const W = canvas.width;
  const H = canvas.height;

  // ── AVATAR (hình tròn, cover-fit) ──────────────────────────────
  const circleCenterX = W * 0.50;
  const circleCenterY = H * 0.385;
  const circleRadius = W * 0.20;

  if (student.sinh_vien.avatar_url) {
    try {
      const url = student.sinh_vien.avatar_url.includes("?")
        ? student.sinh_vien.avatar_url
        : `${student.sinh_vien.avatar_url}?t=${Date.now()}`;
      const avatarImg = await loadImage(url);

      ctx.save();
      // Clip hình tròn
      ctx.beginPath();
      ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Cover-fit: scale ảnh để phủ kín hình tròn, không bị méo
      const imgRatio = avatarImg.width / avatarImg.height;
      const targetSize = circleRadius * 2;
      let drawW: number, drawH: number;
      if (imgRatio > 1) {
        // Ảnh ngang: height fit, width overflow
        drawH = targetSize;
        drawW = targetSize * imgRatio;
      } else {
        // Ảnh dọc: width fit, height overflow
        drawW = targetSize;
        drawH = targetSize / imgRatio;
      }
      const drawX = circleCenterX - drawW / 2;
      const drawY = circleCenterY - drawH / 2;
      ctx.drawImage(avatarImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch (e) {
      console.warn("[Poster] Không load được avatar:", e);
    }
  }

  // ── TEXT SECTION ─────────────────────────────────────────────────
  const textMaxWidth = W * 0.72;
  const centerX = W / 2;

  // Font sizes tương đối
  const fsName = Math.max(Math.round(W * 0.052), 24);
  const fsInfo = Math.max(Math.round(W * 0.035), 16);
  const fsTitle = Math.max(Math.round(W * 0.04), 18);
  const outlineW = Math.max(Math.round(W * 0.005), 3);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // ── Tên sinh viên (vàng, to, bold) ──
  let curY = H * 0.59;
  ctx.font = `bold ${fsName}px 'Segoe UI', 'Arial', sans-serif`;
  const nameLines = wrapText(ctx, student.sinh_vien.ho_ten.toUpperCase(), textMaxWidth);
  const nameLineH = fsName * 1.3;
  nameLines.forEach((line, i) => {
    drawTextOutline(ctx, line, centerX, curY + i * nameLineH, "#FFD700", "rgba(0,0,0,0.85)", outlineW);
  });

  // ── MSSV ──
  curY = curY + nameLines.length * nameLineH + fsInfo * 0.8;
  ctx.font = `600 ${fsInfo}px 'Segoe UI', 'Arial', sans-serif`;
  drawTextOutline(ctx, `MSSV: ${student.sinh_vien.ma_sv || "—"}`, centerX, curY, "#FFFFFF", "rgba(0,0,0,0.7)", outlineW);

  // ── Lớp — Khoa ──
  curY += fsInfo * 1.7;
  const classText = student.sinh_vien.lop?.ten_lop || "";
  const khoaText = student.sinh_vien.khoa?.ten_khoa || "";
  const infoText = [classText, khoaText].filter(Boolean).join("  •  ");
  if (infoText) {
    const infoLines = wrapText(ctx, infoText, textMaxWidth);
    infoLines.forEach((line) => {
      drawTextOutline(ctx, line, centerX, curY, "#E2E8F0", "rgba(0,0,0,0.7)", outlineW);
      curY += fsInfo * 1.5;
    });
  }

  // ── Số lần đạt danh hiệu ──
  curY += fsTitle * 0.5;
  ctx.font = `bold ${fsTitle}px 'Segoe UI', 'Arial', sans-serif`;
  const trophyText = `🏆 Đạt danh hiệu ${student.so_lan_dat} lần`;
  drawTextOutline(ctx, trophyText, centerX, curY, "#FCD34D", "rgba(0,0,0,0.9)", outlineW + 1);
}
