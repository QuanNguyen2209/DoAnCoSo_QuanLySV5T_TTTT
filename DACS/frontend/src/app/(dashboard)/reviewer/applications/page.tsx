"use client";

import { motion } from "framer-motion";
import { Search, Filter, CheckCircle, XCircle, FileText, AlertCircle, Eye, Inbox } from "lucide-react";

export default function ReviewerApplicationsPage() {
  const applications = [
    { 
      id: "SV-001", student: "Nguyễn Lê Nguyên Quân", class: "KHMT2019", 
      title: "Sinh viên 5 Tốt", date: "24/03/2026", 
      status: "pending", score: "85/100" 
    },
    { 
      id: "SV-002", student: "Nguyễn Văn A", class: "HTTT2020", 
      title: "Sinh viên 5 Tốt", date: "23/03/2026", 
      status: "pending", score: "92/100" 
    },
    { 
      id: "TT-005", student: "Ban Cán sự Lớp", class: "KTPM2021", 
      title: "Tập thể Tiên tiến", date: "22/03/2026", 
      status: "reviewing", score: "--" 
    },
    { 
      id: "SV-010", student: "Trần Thị C", class: "KHMT2019", 
      title: "Sinh viên 5 Tốt", date: "20/03/2026", 
      status: "approved", score: "100/100" 
    },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Xét duyệt hồ sơ</h1>
          <p className="text-slate-500 font-medium mt-1">Hệ thống xử lý hồ sơ đăng ký dành cho Cán bộ Đoàn - Hội</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4"><Inbox className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-slate-900">45</div>
          <div className="text-sm font-bold text-slate-500">Cần xét duyệt</div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4"><CheckCircle className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-slate-900">128</div>
          <div className="text-sm font-bold text-slate-500">Đã thông qua</div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4"><XCircle className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-slate-900">12</div>
          <div className="text-sm font-bold text-slate-500">Bị từ chối</div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4"><AlertCircle className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-slate-900">8</div>
          <div className="text-sm font-bold text-slate-500">Chờ bổ sung minh chứng</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-lg">Danh sách chờ xử lý</h2>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Lọc Khoa/Lớp</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Người nộp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Danh hiệu</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Điểm TĐ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Phê duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                  <td className="px-6 py-5">
                    <span className="font-bold text-slate-900 text-sm block">{app.student}</span>
                    <span className="text-[10px] font-bold text-slate-400 tracking-wide">{app.class} • #{app.id}</span>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-600 text-sm">{app.title}</td>
                  <td className="px-6 py-5 font-black text-indigo-600">{app.score}</td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 
                        ${app.status === 'pending' ? 'bg-orange-100 text-orange-600' : 
                          app.status === 'reviewing' ? 'bg-blue-100 text-blue-600' : 
                          'bg-emerald-100 text-emerald-600'}`}>
                        {app.status === 'pending' ? 'Chưa xét' : app.status === 'reviewing' ? 'Đang duyệt' : 'Đã duyệt'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right space-x-2">
                    <button className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                      Chấm hồ sơ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
