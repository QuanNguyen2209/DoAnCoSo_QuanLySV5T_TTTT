"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, School, Building2, Edit3, Trash2, X, Loader2, BookOpen } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";

interface Khoa { id: number; ma_khoa: string; ten_khoa: string; so_lop: number; }
interface LopHoc { id: number; ma_lop: string; ten_lop: string; khoa_id: number; nien_khoa: string; khoa?: { id: number; ma_khoa: string; ten_khoa: string }; }

export default function AdminClassesPage() {
  const [khoaList, setKhoaList] = useState<Khoa[]>([]);
  const [lopList, setLopList] = useState<LopHoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"khoa" | "lop">("khoa");

  // Modal
  const [showKhoaModal, setShowKhoaModal] = useState(false);
  const [showLopModal, setShowLopModal] = useState(false);
  const [editingKhoa, setEditingKhoa] = useState<Khoa | null>(null);
  const [editingLop, setEditingLop] = useState<LopHoc | null>(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [khoaForm, setKhoaForm] = useState({ ma_khoa: "", ten_khoa: "" });
  const [lopForm, setLopForm] = useState({ ma_lop: "", ten_lop: "", khoa_id: 0, nien_khoa: "" });

  const fetchData = useCallback(async () => {
    try {
      const [khoaRes, lopRes] = await Promise.all([api.get("/khoa"), api.get("/lop-hoc")]);
      if (khoaRes.data.success) setKhoaList(khoaRes.data.data || []);
      if (lopRes.data.success) setLopList(lopRes.data.data || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Khoa CRUD
  const openCreateKhoa = () => { setEditingKhoa(null); setKhoaForm({ ma_khoa: "", ten_khoa: "" }); setShowKhoaModal(true); };
  const openEditKhoa = (k: Khoa) => { setEditingKhoa(k); setKhoaForm({ ma_khoa: k.ma_khoa, ten_khoa: k.ten_khoa }); setShowKhoaModal(true); };
  const saveKhoa = async () => {
    setSaving(true);
    try {
      if (editingKhoa) await api.put(`/khoa/${editingKhoa.id}`, khoaForm);
      else await api.post("/khoa", khoaForm);
      setShowKhoaModal(false); fetchData();
    } catch (err: any) { alert(err.response?.data?.error || "Lỗi"); } finally { setSaving(false); }
  };
  const deleteKhoa = async (id: number) => {
    if (!confirm("Xóa khoa này? Tất cả lớp thuộc khoa cũng sẽ bị ảnh hưởng.")) return;
    try { await api.delete(`/khoa/${id}`); fetchData(); } catch (err: any) { alert(err.response?.data?.error || "Lỗi"); }
  };

  // Lop CRUD
  const openCreateLop = () => { setEditingLop(null); setLopForm({ ma_lop: "", ten_lop: "", khoa_id: khoaList[0]?.id || 0, nien_khoa: "" }); setShowLopModal(true); };
  const openEditLop = (l: LopHoc) => { setEditingLop(l); setLopForm({ ma_lop: l.ma_lop, ten_lop: l.ten_lop, khoa_id: l.khoa_id, nien_khoa: l.nien_khoa }); setShowLopModal(true); };
  const saveLop = async () => {
    setSaving(true);
    try {
      if (editingLop) await api.put(`/lop-hoc/${editingLop.id}`, lopForm);
      else await api.post("/lop-hoc", lopForm);
      setShowLopModal(false); fetchData();
    } catch (err: any) { alert(err.response?.data?.error || "Lỗi"); } finally { setSaving(false); }
  };
  const deleteLop = async (id: number) => {
    if (!confirm("Xóa lớp này?")) return;
    try { await api.delete(`/lop-hoc/${id}`); fetchData(); } catch (err: any) { alert(err.response?.data?.error || "Lỗi"); }
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quản lý Lớp & Khoa</h1>
          <p className="text-slate-500 font-medium mt-1">Quản lý danh mục đơn vị đào tạo trong hệ thống</p>
        </div>
        <div className="flex gap-3">
          <button onClick={openCreateKhoa} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
            <Building2 className="w-5 h-5" /> Thêm Khoa
          </button>
          <button onClick={openCreateLop} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
            <Plus className="w-5 h-5" /> Thêm Lớp
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setTab("khoa")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "khoa" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          Khoa ({khoaList.length})
        </button>
        <button onClick={() => setTab("lop")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === "lop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
          Lớp ({lopList.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : tab === "khoa" ? (
        /* Khoa Grid */
        <div className="grid md:grid-cols-3 gap-6">
          {khoaList.map((dept, i) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              key={dept.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <School className="w-6 h-6" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditKhoa(dept)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => deleteKhoa(dept.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{dept.ten_khoa}</h3>
              <p className="text-sm font-bold text-indigo-600 mb-4">{dept.ma_khoa}</p>
              <div className="flex items-center justify-between text-sm font-bold pt-4 border-t border-slate-100">
                <span className="text-slate-400 uppercase tracking-wider">Số lớp</span>
                <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{dept.so_lop}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Lop Table */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Mã lớp</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tên lớp</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Khoa</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Niên khóa</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lopList.map((lop, i) => (
                  <motion.tr key={lop.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-sm">{lop.ma_lop}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">{lop.ten_lop}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{lop.khoa?.ten_khoa || "—"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{lop.nien_khoa}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditLop(lop)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteLop(lop.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Khoa */}
      <AnimatePresence>
        {showKhoaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowKhoaModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">{editingKhoa ? "Sửa Khoa" : "Thêm Khoa"}</h2>
                <button onClick={() => setShowKhoaModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mã khoa *</label>
                  <input value={khoaForm.ma_khoa} onChange={e => setKhoaForm({ ...khoaForm, ma_khoa: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none" placeholder="VD: CNTT" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tên khoa *</label>
                  <input value={khoaForm.ten_khoa} onChange={e => setKhoaForm({ ...khoaForm, ten_khoa: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none" placeholder="VD: Công nghệ Thông tin" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowKhoaModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Hủy</button>
                <button onClick={saveKhoa} disabled={saving || !khoaForm.ma_khoa || !khoaForm.ten_khoa}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingKhoa ? "Cập nhật" : "Tạo"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Lop */}
      <AnimatePresence>
        {showLopModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLopModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">{editingLop ? "Sửa Lớp" : "Thêm Lớp"}</h2>
                <button onClick={() => setShowLopModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mã lớp *</label>
                  <input value={lopForm.ma_lop} onChange={e => setLopForm({ ...lopForm, ma_lop: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none" placeholder="VD: CNTT01" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tên lớp *</label>
                  <input value={lopForm.ten_lop} onChange={e => setLopForm({ ...lopForm, ten_lop: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none" placeholder="VD: CNTT K22A" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Thuộc Khoa *</label>
                  <select value={lopForm.khoa_id} onChange={e => setLopForm({ ...lopForm, khoa_id: parseInt(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-500 outline-none bg-white">
                    {khoaList.map(k => <option key={k.id} value={k.id}>{k.ten_khoa}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Niên khóa</label>
                  <input value={lopForm.nien_khoa} onChange={e => setLopForm({ ...lopForm, nien_khoa: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none" placeholder="VD: 2022-2026" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowLopModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Hủy</button>
                <button onClick={saveLop} disabled={saving || !lopForm.ma_lop || !lopForm.ten_lop}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingLop ? "Cập nhật" : "Tạo"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
