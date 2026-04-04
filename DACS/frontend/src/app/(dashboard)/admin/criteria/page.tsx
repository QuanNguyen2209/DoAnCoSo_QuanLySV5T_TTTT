"use client";

import { motion } from "framer-motion";
import { Plus, GripVertical, Settings2, ShieldCheck, HeartPulse, GraduationCap, Users } from "lucide-react";

export default function CriteriaManagementPage() {
  const criteriaList = [
    { title: "Đạo đức tốt", icon: ShieldCheck, color: "text-rose-500 bg-rose-100", items: 5 },
    { title: "Học tập tốt", icon: GraduationCap, color: "text-blue-500 bg-blue-100", items: 4 },
    { title: "Thể lực tốt", icon: HeartPulse, color: "text-emerald-500 bg-emerald-100", items: 3 },
    { title: "Tình nguyện tốt", icon: Users, color: "text-orange-500 bg-orange-100", items: 6 },
    { title: "Hội nhập tốt", icon: Settings2, color: "text-purple-500 bg-purple-100", items: 4 },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tiêu chí đánh giá</h1>
          <p className="text-slate-500 font-medium mt-1">Thiết lập bộ tiêu chuẩn "Sinh viên 5 Tốt" và "Tập thể Tiên tiến"</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 w-fit">
          <Plus className="w-5 h-5" />
          Thêm bộ tiêu chí
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar categories */}
        <div className="md:col-span-1 space-y-3">
          <div className="p-4 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-2xl flex items-center justify-between cursor-pointer">
            Sinh viên 5 Tốt (Cấp Trường)
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          </div>
          <div className="p-4 bg-white border border-slate-100 text-slate-600 font-bold rounded-2xl hover:border-slate-300 transition-all cursor-pointer">
            Sinh viên 5 Tốt (Cấp Khoa)
          </div>
          <div className="p-4 bg-white border border-slate-100 text-slate-600 font-bold rounded-2xl hover:border-slate-300 transition-all cursor-pointer">
            Tập thể Tiên tiến
          </div>
        </div>

        {/* Categories Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Chi tiết 5 Tiêu chuẩn</h2>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Chỉnh sửa trọng số</button>
          </div>

          {criteriaList.map((c, i) => (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="p-5 bg-white border border-slate-200 rounded-3xl flex items-center gap-4 hover:shadow-md transition-shadow group cursor-pointer"
            >
              <div className="cursor-grab text-slate-300 hover:text-slate-500">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.color}`}>
                <c.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{c.title}</h3>
                <p className="text-xs font-semibold text-slate-500">{c.items} tiêu chí con phụ thuộc</p>
              </div>
              <button className="px-4 py-2 rounded-xl bg-slate-50 text-slate-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100">
                Cấu hình
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
