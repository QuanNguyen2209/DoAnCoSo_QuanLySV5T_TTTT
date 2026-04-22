"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShieldCheck, HeartPulse, GraduationCap, Users, Globe, Edit3, Trash2, X, Loader2, ChevronDown, ChevronRight, Star, ListTree, Award, Building } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";

interface TieuChi {
  id: number;
  ten_tieu_chi: string;
  mo_ta: string;
  thu_tu: number;
  parent_id: number | null;
  is_active: boolean;
  loai_doi_tuong: string;
  children?: TieuChi[];
}

const iconMap: Record<number, any> = {
  1: ShieldCheck, 2: GraduationCap, 3: HeartPulse, 4: Users, 5: Globe,
};
const colorMap: Record<number, { bg: string; text: string; border: string; light: string }> = {
  1: { bg: "bg-rose-500", text: "text-rose-600", border: "border-rose-200", light: "bg-rose-50" },
  2: { bg: "bg-blue-500", text: "text-blue-600", border: "border-blue-200", light: "bg-blue-50" },
  3: { bg: "bg-emerald-500", text: "text-emerald-600", border: "border-emerald-200", light: "bg-emerald-50" },
  4: { bg: "bg-orange-500", text: "text-orange-600", border: "border-orange-200", light: "bg-orange-50" },
  5: { bg: "bg-purple-500", text: "text-purple-600", border: "border-purple-200", light: "bg-purple-50" },
};

export default function CriteriaManagementPage() {
  const [tree, setTree] = useState<TieuChi[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabType, setTabType] = useState<"individual" | "collective">("individual");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TieuChi | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ten_tieu_chi: "", mo_ta: "", thu_tu: 1, parent_id: null as number | null, loai_doi_tuong: "individual" });
  const [parentLabel, setParentLabel] = useState("");

  const fetchCriteria = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/tieu-chi", { params: { loai_doi_tuong: tabType } });
      if (res.data.success) {
        setTree(res.data.data || []);
        // Expand all by default
        const exp: Record<number, boolean> = {};
        (res.data.data || []).forEach((p: TieuChi) => { exp[p.id] = true; });
        setExpanded(exp);
      }
    } catch { } finally { setLoading(false); }
  }, [tabType]);

  useEffect(() => { fetchCriteria(); }, [fetchCriteria]);

  const toggleExpand = (id: number) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Thêm tiêu chí lớn (cha)
  const openCreateParent = () => {
    setEditing(null);
    setForm({ ten_tieu_chi: "", mo_ta: "", thu_tu: tree.length + 1, parent_id: null, loai_doi_tuong: tabType });
    setParentLabel("");
    setShowModal(true);
  };

  // Thêm tiêu chí nhỏ (con)
  const openCreateChild = (parent: TieuChi) => {
    setEditing(null);
    setForm({ ten_tieu_chi: "", mo_ta: "", thu_tu: (parent.children?.length || 0) + 1, parent_id: parent.id, loai_doi_tuong: tabType });
    setParentLabel(parent.ten_tieu_chi);
    setShowModal(true);
  };

  // Sửa
  const openEdit = (tc: TieuChi, parentName?: string) => {
    setEditing(tc);
    setForm({ ten_tieu_chi: tc.ten_tieu_chi, mo_ta: tc.mo_ta || "", thu_tu: tc.thu_tu, parent_id: tc.parent_id, loai_doi_tuong: tc.loai_doi_tuong });
    setParentLabel(parentName || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/tieu-chi/${editing.id}`, form);
      } else {
        await api.post("/tieu-chi", form);
      }
      setShowModal(false);
      fetchCriteria();
    } catch (err: any) {
      alert(err.response?.data?.error || "Lỗi khi lưu");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa "${name}"?`)) return;
    try {
      await api.delete(`/tieu-chi/${id}`);
      fetchCriteria();
    } catch (err: any) { alert(err.response?.data?.error || "Lỗi"); }
  };

  const totalChildren = tree.reduce((sum, p) => sum + (p.children?.length || 0), 0);

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tiêu chí đánh giá</h1>
          <p className="text-slate-500 font-medium mt-1">Cấu trúc bộ tiêu chuẩn xét duyệt sinh viên</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
          <button onClick={() => setTabType("individual")} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tabType === "individual" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Award className="w-4 h-4" /> Sinh viên 5 Tốt
          </button>
          <button onClick={() => setTabType("collective")} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tabType === "collective" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Building className="w-4 h-4" /> Tập thể Tiên tiến
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-slate-600 font-bold">
          Bộ tiêu chuẩn <span className="text-indigo-600">{tabType === "individual" ? "Sinh viên 5 Tốt" : "Tập thể Tiên tiến"}</span> — {tree.length} tiêu chuẩn lớn, {totalChildren} tiêu chí con
        </p>
        <button onClick={openCreateParent} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 w-fit">
          <Plus className="w-5 h-5" /> Thêm tiêu chuẩn
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {tree.map((parent, i) => {
          const color = colorMap[(i % 5) + 1] || colorMap[1];
          const Icon = iconMap[(i % 5) + 1] || Star;
          return (
            <div key={parent.id} className={`${color.light} border ${color.border} rounded-2xl p-4 text-center`}>
              <Icon className={`w-6 h-6 ${color.text} mx-auto mb-2`} />
              <p className="text-xs font-bold text-slate-700 truncate">{parent.ten_tieu_chi}</p>
              <p className={`text-lg font-black ${color.text}`}>{parent.children?.length || 0} <span className="text-xs font-bold text-slate-400">tiêu chí con</span></p>
            </div>
          );
        })}
      </div>

      {/* Tree View */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
      ) : tree.length === 0 ? (
        <div className="text-center py-20 text-slate-400 font-medium bg-slate-50 rounded-3xl border border-slate-200">
          Chưa có tiêu chí nào cho {tabType === "individual" ? "Sinh viên 5 Tốt" : "Tập thể Tiên tiến"}
        </div>
      ) : (
        <div className="space-y-6">
          {tree.map((parent, pIdx) => {
            const color = colorMap[(pIdx % 5) + 1] || colorMap[1];
            const Icon = iconMap[(pIdx % 5) + 1] || Star;
            const isExpanded = expanded[parent.id] ?? true;

            return (
              <motion.div key={parent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: pIdx * 0.05 }}
                className={`bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all`}>

                {/* Parent Header */}
                <div className={`flex items-center gap-4 p-6 cursor-pointer group ${color.light}`} onClick={() => toggleExpand(parent.id)}>
                  <div className={`w-12 h-12 ${color.bg} text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-lg">{parent.thu_tu}. {parent.ten_tieu_chi}</h3>
                    {parent.mo_ta && <p className="text-sm text-slate-500 truncate">{parent.mo_ta}</p>}
                  </div>
                  <span className={`text-xs font-bold ${color.text} ${color.light} px-3 py-1 rounded-full border ${color.border}`}>
                    {parent.children?.length || 0} tiêu chí con
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); openCreateChild(parent); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl opacity-0 group-hover:opacity-100 transition-all" title="Thêm tiêu chí con">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); openEdit(parent); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(parent.id, parent.ten_tieu_chi); }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronDown className={`w-5 h-5 ${color.text}`} /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>

                {/* Children */}
                <AnimatePresence>
                  {isExpanded && parent.children && parent.children.length > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100">
                      {parent.children.map((child, cIdx) => (
                        <div key={child.id}
                          className={`flex items-center gap-4 px-6 py-4 group hover:bg-slate-50/80 transition-colors ${cIdx < parent.children!.length - 1 ? "border-b border-slate-50" : ""}`}>
                          <div className="w-8 flex justify-center">
                            <div className={`w-2.5 h-2.5 rounded-full ${color.bg} opacity-40`}></div>
                          </div>
                          <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 text-xs font-black text-slate-500">
                            {parent.thu_tu}.{child.thu_tu}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-800 text-sm">{child.ten_tieu_chi}</p>
                            {child.mo_ta && <p className="text-xs text-slate-500 truncate">{child.mo_ta}</p>}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(child, parent.ten_tieu_chi)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(child.id, child.ten_tieu_chi)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty children state */}
                {isExpanded && (!parent.children || parent.children.length === 0) && (
                  <div className="px-6 py-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-400 font-medium mb-3">Chưa có tiêu chí con nào</p>
                    <button onClick={() => openCreateChild(parent)}
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 mx-auto">
                      <Plus className="w-4 h-4" /> Thêm tiêu chí con
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo/Sửa */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {editing ? "Chỉnh sửa tiêu chí" : form.parent_id ? "Thêm tiêu chí con" : "Thêm tiêu chuẩn lớn"}
                  </h2>
                  {parentLabel && (
                    <p className="text-sm text-indigo-600 font-medium mt-1 flex items-center gap-1">
                      <ListTree className="w-4 h-4" /> Thuộc: {parentLabel}
                    </p>
                  )}
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tên tiêu chí *</label>
                  <input value={form.ten_tieu_chi} onChange={e => setForm({ ...form, ten_tieu_chi: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none"
                    placeholder={form.parent_id ? "VD: Điểm trung bình >= 2.0" : "VD: Tiêu chuẩn Học tập"} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả / Điểm</label>
                  <textarea value={form.mo_ta} onChange={e => setForm({ ...form, mo_ta: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none resize-none h-20"
                    placeholder="Mô tả ngắn gọn hoặc số điểm..." />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Thứ tự</label>
                  <input type="number" min={1} value={form.thu_tu} onChange={e => setForm({ ...form, thu_tu: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Hủy</button>
                <button onClick={handleSave} disabled={saving || !form.ten_tieu_chi}
                  className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
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
