"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Download, Users, CheckCircle2, Clock, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "@/lib/axios";

export default function AdminStatisticsPage() {
  const [stats, setStats] = useState({ totalUsers: 0, totalHoSo: 0, pending: 0, approved: 0, rejected: 0, draft: 0, periods: 0, criteria: 0 });
  const [loading, setLoading] = useState(true);
  const [recentHoSo, setRecentHoSo] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, hoSoRes, periodsRes, criteriaRes] = await Promise.all([
          api.get("/users"),
          api.get("/ho-so"),
          api.get("/ky-xet-duyet"),
          api.get("/tieu-chi"),
        ]);

        const users = usersRes.data.data || [];
        const hoSo = hoSoRes.data.data || [];
        const periods = periodsRes.data.data || [];
        const criteria = criteriaRes.data.data || [];

        setStats({
          totalUsers: users.length,
          totalHoSo: hoSo.length,
          pending: hoSo.filter((h: any) => h.trang_thai === "pending").length,
          approved: hoSo.filter((h: any) => h.trang_thai === "approved").length,
          rejected: hoSo.filter((h: any) => h.trang_thai === "rejected").length,
          draft: hoSo.filter((h: any) => h.trang_thai === "draft").length,
          periods: periods.length,
          criteria: criteria.length,
        });

        setRecentHoSo(hoSo.slice(0, 5));
      } catch { } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const approvalRate = stats.totalHoSo > 0 ? ((stats.approved / stats.totalHoSo) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Thống kê & Báo cáo</h1>
          <p className="text-slate-500 font-medium mt-1">Tổng quan dữ liệu xét duyệt toàn hệ thống</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
          <Download className="w-5 h-5" /> Xuất báo cáo
        </button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Tổng hồ sơ", count: stats.totalHoSo, icon: FileText, color: "bg-blue-500" },
          { label: "Đã duyệt", count: stats.approved, icon: CheckCircle2, color: "bg-emerald-500" },
          { label: "Đang chờ", count: stats.pending, icon: Clock, color: "bg-orange-500" },
          { label: "Tỷ lệ đạt", count: `${approvalRate}%`, icon: TrendingUp, color: "bg-purple-500" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className={`w-10 h-10 ${item.color} text-white rounded-xl flex items-center justify-center mb-4`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{item.count}</div>
            <div className="text-sm font-bold text-slate-500">{item.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">Người dùng</span>
          </div>
          <div className="text-4xl font-black text-indigo-600 mb-2">{stats.totalUsers}</div>
          <p className="text-sm text-slate-500">Tổng tài khoản trong hệ thống</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-900">Kỳ xét duyệt</span>
          </div>
          <div className="text-4xl font-black text-emerald-600 mb-2">{stats.periods}</div>
          <p className="text-sm text-slate-500">Tổng kỳ xét duyệt đã tạo</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-slate-900">Tiêu chí</span>
          </div>
          <div className="text-4xl font-black text-orange-600 mb-2">{stats.criteria}</div>
          <p className="text-sm text-slate-500">Tiêu chí đánh giá đang hoạt động</p>
        </div>
      </div>

      {/* Ho So Status Breakdown */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Phân bố trạng thái hồ sơ</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { label: "Bản nháp", count: stats.draft, color: "bg-slate-200", textColor: "text-slate-700" },
            { label: "Đang chờ duyệt", count: stats.pending, color: "bg-amber-200", textColor: "text-amber-700" },
            { label: "Đã duyệt", count: stats.approved, color: "bg-emerald-200", textColor: "text-emerald-700" },
            { label: "Bị từ chối", count: stats.rejected, color: "bg-rose-200", textColor: "text-rose-700" },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className={`w-full h-3 rounded-full bg-slate-100 mb-3 overflow-hidden`}>
                <div className={`h-full ${item.color} rounded-full transition-all`}
                  style={{ width: stats.totalHoSo > 0 ? `${(item.count / stats.totalHoSo) * 100}%` : "0%" }} />
              </div>
              <div className={`text-2xl font-black ${item.textColor}`}>{item.count}</div>
              <div className="text-xs font-bold text-slate-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Ho So */}
      {recentHoSo.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Hồ sơ gần đây</h2>
          <div className="space-y-3">
            {recentHoSo.map((hs: any) => (
              <div key={hs.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{hs.ma_ho_so}</p>
                  <p className="text-xs text-slate-500">{hs.ky_xet_duyet?.ten_ky || "—"}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  hs.trang_thai === "approved" ? "bg-emerald-100 text-emerald-700" :
                  hs.trang_thai === "pending" ? "bg-amber-100 text-amber-700" :
                  hs.trang_thai === "rejected" ? "bg-rose-100 text-rose-700" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {hs.trang_thai === "approved" ? "Đã duyệt" :
                   hs.trang_thai === "pending" ? "Đang chờ" :
                   hs.trang_thai === "rejected" ? "Từ chối" : "Bản nháp"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
