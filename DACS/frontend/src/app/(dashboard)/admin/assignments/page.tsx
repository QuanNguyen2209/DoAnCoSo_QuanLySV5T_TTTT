"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, School, Trash2, X, Loader2, Search, UserCheck } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";

interface Reviewer {
  id: number;
  ho_ten: string;
  email: string;
  ma_sv: string;
}

interface LopHoc {
  id: number;
  ma_lop: string;
  ten_lop: string;
  khoa?: { ten_khoa: string };
}

interface Assignment {
  id: number;
  reviewer_id: number;
  lop_id: number;
  users: Reviewer;
  lop_hoc: LopHoc;
}

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [classes, setClasses] = useState<LopHoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  // Form state
  const [form, setForm] = useState({ reviewer_id: 0, lop_id: 0 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [assignRes, revRes, classRes] = await Promise.all([
        api.get("/reviewer/admin/all-assignments"),
        api.get("/reviewer/admin/reviewers"),
        api.get("/lop-hoc")
      ]);
      
      if (assignRes.data.success) setAssignments(assignRes.data.data || []);
      if (revRes.data.success) {
        const revs = revRes.data.data || [];
        setReviewers(revs);
        if (revs.length > 0) setForm(f => ({ ...f, reviewer_id: revs[0].id }));
      }
      if (classRes.data.success) {
        const cls = classRes.data.data || [];
        setClasses(cls);
        if (cls.length > 0) setForm(f => ({ ...f, lop_id: cls[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    if (!form.reviewer_id || !form.lop_id) return;
    setSaving(true);
    try {
      await api.post("/reviewer/admin/assignments", form);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Lỗi khi phân công");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phân công này?")) return;
    try {
      await api.delete(`/reviewer/admin/assignments/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Lỗi khi xóa");
    }
  };

  const filteredAssignments = assignments.filter(a => 
    a.users.ho_ten.toLowerCase().includes(search.toLowerCase()) ||
    a.lop_hoc.ma_lop.toLowerCase().includes(search.toLowerCase()) ||
    a.lop_hoc.ten_lop.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Phân công xét duyệt</h1>
          <p className="text-slate-500 font-medium mt-1">Gán lớp học cho cán bộ Đoàn - Hội quản lý và chấm điểm</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 w-fit"
        >
          <Plus className="w-5 h-5" /> Thêm phân công
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{reviewers.length}</div>
            <div className="text-sm font-medium text-slate-500">Cán bộ Reviewer</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><School className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{classes.length}</div>
            <div className="text-sm font-medium text-slate-500">Tổng số lớp</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><UserCheck className="w-6 h-6" /></div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{assignments.length}</div>
            <div className="text-sm font-medium text-slate-500">Đã phân công</div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Danh sách phân công</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm cán bộ hoặc lớp..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Cán bộ chấm</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Lớp quản lý</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Khoa</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((a, i) => (
                  <motion.tr 
                    key={a.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-900">{a.users.ho_ten}</div>
                        <div className="text-xs text-slate-500">{a.users.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-sm">
                        {a.lop_hoc.ma_lop} - {a.lop_hoc.ten_lop}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {a.lop_hoc.khoa?.ten_khoa || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(a.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-medium">
                      Chưa có dữ liệu phân công phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm phân công */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-900">Thêm phân công mới</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Cán bộ Reviewer</label>
                  <select 
                    value={form.reviewer_id} 
                    onChange={e => setForm({ ...form, reviewer_id: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    {reviewers.map(r => (
                      <option key={r.id} value={r.id}>{r.ho_ten} ({r.email})</option>
                    ))}
                    {reviewers.length === 0 && <option value="0">Không có cán bộ</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Chọn Lớp học</label>
                  <select 
                    value={form.lop_id} 
                    onChange={e => setForm({ ...form, lop_id: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.ma_lop} - {c.ten_lop}</option>
                    ))}
                    {classes.length === 0 && <option value="0">Không có lớp</option>}
                  </select>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl text-blue-700 text-sm font-medium flex gap-3">
                  <UserCheck className="w-5 h-5 shrink-0" />
                  <p>Cán bộ sau khi được phân công sẽ có quyền xem và chấm điểm hồ sơ của tất cả sinh viên thuộc lớp này.</p>
                </div>
              </div>

              <div className="flex gap-3 mt-10">
                <button 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleAdd}
                  disabled={saving || reviewers.length === 0 || classes.length === 0}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu phân công
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
