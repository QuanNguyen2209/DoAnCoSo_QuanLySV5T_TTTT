"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit3, Trash2, Calendar, Clock, Lock, Unlock, X, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";

interface Period {
  id: number;
  ten_ky: string;
  mo_ta: string;
  loai: string;
  nam_hoc: string;
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  trang_thai: "upcoming" | "active" | "closed";
}

const statusLabels: Record<string, string> = { upcoming: "Sắp mở", active: "Đang mở", closed: "Đã đóng" };

export default function PeriodsManagementPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState({ ten_ky: "", mo_ta: "", loai: "hk1", nam_hoc: "", ngay_bat_dau: "", ngay_ket_thuc: "", trang_thai: "upcoming" });

  const fetchPeriods = useCallback(async () => {
    try {
      const res = await api.get("/ky-xet-duyet");
      if (res.data.success) setPeriods(res.data.data || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ten_ky: "", mo_ta: "", loai: "hk1", nam_hoc: "", ngay_bat_dau: "", ngay_ket_thuc: "", trang_thai: "upcoming" });
    setShowModal(true);
  };

  const openEdit = (p: Period) => {
    setEditing(p);
    setForm({
      ten_ky: p.ten_ky, mo_ta: p.mo_ta || "", loai: p.loai, nam_hoc: p.nam_hoc,
      ngay_bat_dau: p.ngay_bat_dau?.slice(0, 10) || "", ngay_ket_thuc: p.ngay_ket_thuc?.slice(0, 10) || "",
      trang_thai: p.trang_thai,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/ky-xet-duyet/${editing.id}`, form);
      } else {
        await api.post("/ky-xet-duyet", form);
      }
      setShowModal(false);
      fetchPeriods();
    } catch (err: any) {
      alert(err.response?.data?.error || "Lỗi khi lưu");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa kỳ xét duyệt này?")) return;
    setDeleting(id);
    try {
      await api.delete(`/ky-xet-duyet/${id}`);
      fetchPeriods();
    } catch (err: any) {
      alert(err.response?.data?.error || "Lỗi khi xóa");
    } finally { setDeleting(null); }
  };

  const filtered = periods.filter(p =>
    p.ten_ky.toLowerCase().includes(search.toLowerCase()) ||
    p.nam_hoc?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kỳ xét duyệt</h1>
          <p className="text-slate-500 font-medium mt-1">Tạo và quản lý các đợt xét duyệt theo năm học</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Tìm kiếm đợt..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none w-64 transition-all"
            />
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
            <Plus className="w-5 h-5" /> Tạo kỳ mới
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 font-medium">
          {search ? "Không tìm thấy kết quả" : "Chưa có kỳ xét duyệt nào. Hãy tạo kỳ mới!"}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((period, i) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              key={period.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  period.trang_thai === "active" ? "bg-emerald-100 text-emerald-600" :
                  period.trang_thai === "upcoming" ? "bg-amber-100 text-amber-600" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {period.trang_thai === "active" ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {statusLabels[period.trang_thai] || period.trang_thai}
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(period)} className="text-slate-400 hover:text-indigo-600"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(period.id)} disabled={deleting === period.id} className="text-slate-400 hover:text-rose-600">
                    {deleting === period.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-lg mb-1 leading-snug">{period.ten_ky}</h3>
              {period.mo_ta && <p className="text-sm text-slate-500 mb-2">{period.mo_ta}</p>}
              <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg w-fit mb-4">{period.nam_hoc}</div>

              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" /> Bắt đầu: {formatDate(period.ngay_bat_dau)}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <Clock className="w-4 h-4 text-slate-400" /> Kết thúc: <span className={period.trang_thai === "active" ? "text-rose-500 font-bold" : ""}>{formatDate(period.ngay_ket_thuc)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Tạo/Sửa */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">{editing ? "Chỉnh sửa kỳ xét duyệt" : "Tạo kỳ xét duyệt mới"}</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tên kỳ *</label>
                  <input value={form.ten_ky} onChange={e => setForm({ ...form, ten_ky: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none" placeholder="VD: Xét duyệt SV5T HK1 2025-2026" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả</label>
                  <textarea value={form.mo_ta} onChange={e => setForm({ ...form, mo_ta: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none resize-none h-20" placeholder="Mô tả ngắn..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Loại</label>
                    <select value={form.loai} onChange={e => setForm({ ...form, loai: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none bg-white">
                      <option value="hk1">Học kỳ 1</option>
                      <option value="hk2">Học kỳ 2</option>
                      <option value="ca_nam">Cả năm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Năm học *</label>
                    <input value={form.nam_hoc} onChange={e => setForm({ ...form, nam_hoc: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none" placeholder="2025-2026" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Ngày bắt đầu</label>
                    <input type="date" value={form.ngay_bat_dau} onChange={e => setForm({ ...form, ngay_bat_dau: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Ngày kết thúc</label>
                    <input type="date" value={form.ngay_ket_thuc} onChange={e => setForm({ ...form, ngay_ket_thuc: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select value={form.trang_thai} onChange={e => setForm({ ...form, trang_thai: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none bg-white">
                    <option value="upcoming">Sắp mở</option>
                    <option value="active">Đang mở</option>
                    <option value="closed">Đã đóng</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Hủy</button>
                <button onClick={handleSave} disabled={saving || !form.ten_ky || !form.nam_hoc}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
