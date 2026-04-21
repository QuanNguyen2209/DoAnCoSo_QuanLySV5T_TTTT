"use client";

import { useEffect, useState } from "react";
import { Users, FileCheck, FileX, Loader2, Inbox } from "lucide-react";
import { reviewerService, ReviewStats } from "@/services/reviewerService";

export default function ReviewerStatisticsPage() {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await reviewerService.getStats();
      setStats(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const totals = stats?.totals || { total: 0, pending: 0, approved: 0, rejected: 0 };
  const classes = stats?.classes || [];

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Thống kê đơn vị</h1>
          <p className="text-slate-500 font-medium mt-1">Theo dõi kết quả xét duyệt của Khoa/Đơn vị quản lý</p>
        </div>
      </div>

      {/* Tổng quan */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-8 bg-white border border-slate-200 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-20 h-20" /></div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng hồ sơ đơn vị</div>
          <div className="text-5xl font-black text-slate-900">{totals.total}</div>
        </div>
        <div className="p-8 bg-white border border-slate-200 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><FileCheck className="w-20 h-20" /></div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Đã duyệt (Đạt)</div>
          <div className="text-5xl font-black text-emerald-600">{totals.approved}</div>
        </div>
        <div className="p-8 bg-white border border-slate-200 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500"><FileX className="w-20 h-20" /></div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Không đạt / Chờ</div>
          <div className="text-5xl font-black text-rose-600">{totals.rejected + (totals.pending || 0)}</div>
        </div>
      </div>

      {/* Tiến độ theo lớp */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Tiến độ xét duyệt theo Lớp</h2>
        </div>
        {classes.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Chưa có lớp nào được phân công.</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {classes.map((item, i) => {
              const pct = item.total > 0 ? Math.round((item.approved / item.total) * 100) : 0;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-700">{item.ten_lop} ({item.ma_lop})</span>
                    <span className="text-slate-400">{item.approved}/{item.total} hồ sơ đạt</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${pct > 80 ? 'bg-emerald-500' : pct > 40 ? 'bg-indigo-500' : 'bg-orange-400'}`}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400 font-medium">
                    <span>Chờ: {item.pending}</span>
                    <span>Đạt: {item.approved}</span>
                    <span>Từ chối: {item.rejected}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
