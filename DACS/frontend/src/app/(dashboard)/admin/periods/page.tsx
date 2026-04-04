"use client";

import { motion } from "framer-motion";
import { Plus, Search, Filter, Edit3, Trash2, Calendar, Clock, Lock, Unlock } from "lucide-react";

export default function PeriodsManagementPage() {
  const periods = [
    {
      id: "P2025-HK2",
      name: "Xét duyệt Sinh viên 5 Tốt HK2 (2024-2025)",
      startDate: "01/03/2026",
      endDate: "30/04/2026",
      status: "active",
      statusLabel: "Đang mở",
      count: 452
    },
    {
      id: "P2025-HK1",
      name: "Xét duyệt Sinh viên 5 Tốt HK1 (2024-2025)",
      startDate: "01/10/2025",
      endDate: "30/11/2025",
      status: "closed",
      statusLabel: "Đã đóng",
      count: 1205
    },
    {
      id: "P2024-HK2",
      name: "Xét duyệt Tập thể Tiên tiến (2023-2024)",
      startDate: "15/05/2025",
      endDate: "15/06/2025",
      status: "closed",
      statusLabel: "Đã đóng",
      count: 45
    }
  ];

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
              type="text" 
              placeholder="Tìm kiếm đợt..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none w-64 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
            <Plus className="w-5 h-5" />
            Tạo kỳ mới
          </button>
        </div>
      </div>

      {/* Grid of Periods */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {periods.map((period, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={period.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                period.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {period.status === 'active' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {period.statusLabel}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-slate-400 hover:text-indigo-600"><Edit3 className="w-4 h-4" /></button>
                <button className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <h3 className="font-bold text-slate-900 text-lg mb-2 leading-snug">{period.name}</h3>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <Calendar className="w-4 h-4 text-slate-400" />
                Bắt đầu: {period.startDate}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <Clock className="w-4 h-4 text-slate-400" />
                Kết thúc: <span className={period.status === 'active' ? 'text-rose-500 font-bold' : ''}>{period.endDate}</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hồ sơ đã nộp</div>
              <div className="text-xl font-black text-indigo-600">{period.count}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
