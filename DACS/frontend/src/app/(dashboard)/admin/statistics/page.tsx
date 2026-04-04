"use client";

import { motion } from "framer-motion";
import { BarChart3, PieChart, TrendingUp, Download, Users, CheckCircle2, Clock } from "lucide-react";

export default function AdminStatisticsPage() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Thống kê & Báo cáo</h1>
          <p className="text-slate-500 font-medium mt-1">Tổng quan dữ liệu xét duyệt toàn hệ thống</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
          <Download className="w-5 h-5" />
          Xuất báo cáo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Tổng hồ sơ", count: "2,450", icon: Users, color: "bg-blue-500" },
          { label: "Đã duyệt", count: "1,120", icon: CheckCircle2, color: "bg-emerald-500" },
          { label: "Đang chờ", count: "850", icon: Clock, color: "bg-orange-500" },
          { label: "Tỷ lệ đạt", count: "45.7%", icon: TrendingUp, color: "bg-purple-500" },
        ].map((item, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className={`w-10 h-10 ${item.color} text-white rounded-xl flex items-center justify-center mb-4`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">{item.count}</div>
            <div className="text-sm font-bold text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-80 flex flex-col items-center justify-center text-slate-400">
          <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-bold whitespace-pre-wrap text-center">Biểu đồ phân bố hồ sơ theo Khoa\n(Sẽ hiển thị khi có dữ liệu thật)</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm h-80 flex flex-col items-center justify-center text-slate-400">
          <PieChart className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-bold whitespace-pre-wrap text-center">Tỷ lệ các loại danh hiệu\n(Sẽ hiển thị khi có dữ liệu thật)</p>
        </div>
      </div>
    </div>
  );
}
