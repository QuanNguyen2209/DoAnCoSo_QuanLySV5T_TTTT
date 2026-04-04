"use client";

import { motion } from "framer-motion";
import { Filter, Download, Users, FileCheck, FileX } from "lucide-react";

export default function ReviewerStatisticsPage() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Thống kê đơn vị</h1>
          <p className="text-slate-500 font-medium mt-1">Theo dõi kết quả xét duyệt của Khoa/Đơn vị quản lý</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 cursor-pointer hover:bg-slate-50">
            <Filter className="w-4 h-4" />
            Lọc theo Lớp
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100">
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-8 bg-white border border-slate-200 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-20 h-20" /></div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Tổng hồ sơ đơn vị</div>
          <div className="text-5xl font-black text-slate-900">452</div>
        </div>
        <div className="p-8 bg-white border border-slate-200 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><FileCheck className="w-20 h-20" /></div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Đã duyệt (Đạt)</div>
          <div className="text-5xl font-black text-emerald-600">312</div>
        </div>
        <div className="p-8 bg-white border border-slate-200 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-500"><FileX className="w-20 h-20" /></div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Không đạt</div>
          <div className="text-5xl font-black text-rose-600">14</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Tiến độ xét duyệt theo Lớp</h2>
        </div>
        <div className="p-6 space-y-6">
          {[
            { name: "KHMT2019", total: 45, done: 40, pct: 88 },
            { name: "HTTT2020", total: 32, done: 12, pct: 37 },
            { name: "KTPM2021", total: 56, done: 50, pct: 89 },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700">{item.name}</span>
                <span className="text-slate-400">{item.done}/{item.total} hồ sơ</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 1, delay: i * 0.2 }}
                  className={`h-full rounded-full ${item.pct > 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
