"use client";

import { motion } from "framer-motion";
import { FolderOpen, Clock, CheckCircle2, XCircle, ChevronRight, FileText, Loader2, Plus, Calendar, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/authStore";
import api from "@/lib/axios";
import dayjs from "dayjs";

export default function StudentRecordsPage() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, draft: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.id) return;
      try {
        const [recordsRes, statsRes] = await Promise.all([
          api.get("/ho-so", { params: { sinh_vien_id: user.id } }),
          api.get(`/ho-so/stats/${user.id}`)
        ]);
        
        if (recordsRes.data.success) {
          setRecords(recordsRes.data.data || []);
        }
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách hồ sơ", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [user?.id]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa bản nháp này?")) return;
    
    try {
      const res = await api.delete(`/ho-so/${id}`);
      if (res.data.success) {
        setRecords(records.filter(r => r.id !== id));
        // Update stats
        if (user?.id) {
          const statsRes = await api.get(`/ho-so/stats/${user.id}`);
          if (statsRes.data.success) {
            setStats(statsRes.data.data);
          }
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Lỗi khi xóa hồ sơ");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hồ sơ của tôi</h1>
          <p className="text-slate-500 font-medium mt-1">Quản lý và theo dõi trạng thái các hồ sơ đã đăng ký</p>
        </div>
        <Link href="/student/register" className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 w-fit">
          <Plus className="w-5 h-5" /> Nộp hồ sơ mới
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Bản nháp", count: stats.draft, icon: FileText, color: "bg-slate-500", light: "bg-slate-50", text: "text-slate-600" },
          { label: "Đang chờ duyệt", count: stats.pending, icon: Clock, color: "bg-amber-500", light: "bg-amber-50", text: "text-amber-600" },
          { label: "Đã duyệt", count: stats.approved, icon: CheckCircle2, color: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-600" },
          { label: "Cần bổ sung", count: stats.rejected, icon: XCircle, color: "bg-rose-500", light: "bg-rose-50", text: "text-rose-600" },
        ].map((item, i) => (
          <div key={i} className={`p-5 rounded-3xl border border-slate-100 ${item.light} flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-2xl ${item.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-2xl font-black ${item.text}`}>{item.count}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {records.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Bạn chưa có hồ sơ nào</h3>
            <p className="text-slate-500 mb-6">Hãy tạo một bản nháp mới để bắt đầu quá trình xét duyệt Sinh viên 5 Tốt.</p>
            <Link href="/student/register" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
              Đăng ký ngay
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Mã hồ sơ</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Kỳ xét duyệt</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Danh hiệu</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Ngày tạo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((hs, i) => (
                  <motion.tr key={hs.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/student/records/${hs.id}`}>
                    <td className="px-6 py-5">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm">{hs.ma_ho_so}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900 text-sm mb-0.5">{hs.ky_xet_duyet?.ten_ky}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> NH: {hs.ky_xet_duyet?.nam_hoc}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-700 text-sm">
                        {hs.loai_doi_tuong === "sv5t" || hs.loai_doi_tuong === "individual" ? "Sinh viên 5 Tốt" : "Tập thể Tiên tiến"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
                        hs.trang_thai === "approved" ? "bg-emerald-100 text-emerald-700" :
                        hs.trang_thai === "pending" ? "bg-amber-100 text-amber-700" :
                        hs.trang_thai === "rejected" ? "bg-rose-100 text-rose-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {hs.trang_thai === "approved" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                         hs.trang_thai === "pending" ? <Clock className="w-3.5 h-3.5" /> :
                         hs.trang_thai === "rejected" ? <XCircle className="w-3.5 h-3.5" /> : 
                         <FileText className="w-3.5 h-3.5" />}
                        {hs.trang_thai === "approved" ? "Đã duyệt" :
                         hs.trang_thai === "pending" ? "Đang chờ" :
                         hs.trang_thai === "rejected" ? "Cần bổ sung" : "Bản nháp"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                      {dayjs(hs.created_at).format("DD/MM/YYYY")}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hs.trang_thai === "draft" && (
                          <button
                            onClick={(e) => handleDelete(hs.id, e)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Xóa bản nháp"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                        <div className="p-2 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-xl transition-all inline-block">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
