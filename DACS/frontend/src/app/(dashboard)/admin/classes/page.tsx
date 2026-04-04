"use client";

import { motion } from "framer-motion";
import { Plus, School, Building2, Edit3, Trash2 } from "lucide-react";

export default function AdminClassesPage() {
  const departments = [
    { id: "K-CNTT", name: "Khoa Công nghệ Thông tin", classes: 24, students: 1200 },
    { id: "K-KT", name: "Khoa Kinh tế", classes: 18, students: 950 },
    { id: "K- Luat", name: "Khoa Luật", classes: 10, students: 500 },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quản lý Lớp & Khoa</h1>
          <p className="text-slate-500 font-medium mt-1">Quản lý danh mục đơn vị đào tạo trong hệ thống</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
            <Building2 className="w-5 h-5" />
            Thêm Khoa
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
            <Plus className="w-5 h-5" />
            Thêm Lớp
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {departments.map((dept, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={dept.id}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <School className="w-6 h-6" />
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-4">{dept.name}</h3>
            <div className="flex items-center justify-between text-sm font-bold">
              <div className="text-slate-400 uppercase tracking-wider">Số lớp</div>
              <div className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{dept.classes}</div>
            </div>
            <div className="flex items-center justify-between text-sm font-bold mt-2">
              <div className="text-slate-400 uppercase tracking-wider">Sinh viên</div>
              <div className="text-slate-900">{dept.students}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
