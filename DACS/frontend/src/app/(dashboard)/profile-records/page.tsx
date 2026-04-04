"use client";

import { motion } from "framer-motion";
import { 
  Search, Filter, Eye, Edit3, Trash2, 
  Clock, CheckCircle2, AlertCircle, FileText
} from "lucide-react";

export default function ProfileRecordsPage() {
  const records = [
    { 
      id: "SV-2024-001", 
      title: "Sinh viên 5 Tốt", 
      target: "Cá nhân", 
      date: "24/03/2026", 
      status: "pending", 
      statusLabel: "Đang chờ duyệt",
      color: "text-orange-600 bg-orange-100"
    },
    { 
      id: "SV-2024-002", 
      title: "Sinh viên Khỏe", 
      target: "Cá nhân", 
      date: "20/03/2026", 
      status: "approved", 
      statusLabel: "Đã duyệt",
      color: "text-emerald-600 bg-emerald-100"
    },
    { 
      id: "TT-2024-012", 
      title: "Tập thể Tiên tiến", 
      target: "Lớp KHMT2019", 
      date: "15/03/2026", 
      status: "rejected", 
      statusLabel: "Cần bổ sung",
      color: "text-rose-600 bg-rose-100"
    },
    { 
      id: "SV-2024-005", 
      title: "Sinh viên 5 Tốt", 
      target: "Cá nhân", 
      date: "10/03/2026", 
      status: "draft", 
      statusLabel: "Bản nháp",
      color: "text-slate-500 bg-slate-100"
    },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hồ sơ đăng ký</h1>
          <p className="text-slate-500 font-medium mt-1">Danh sách các danh hiệu đã nộp và trạng thái xét duyệt</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Mã hồ sơ, tên danh hiệu..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none w-64 transition-all"
            />
          </div>
          <button className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Mã hồ sơ</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Danh hiệu</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Đối tượng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Ngày nộp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={record.id} 
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-5 font-bold text-slate-400 text-sm group-hover:text-indigo-600 transition-colors">#{record.id}</td>
                  <td className="px-6 py-5 min-w-[200px]">
                    <span className="font-bold text-slate-900 text-sm block">{record.title}</span>
                    <span className="text-[10px] font-bold text-indigo-500 tracking-wide">HK2 / 2024-2025</span>
                  </td>
                  <td className="px-6 py-5 text-center min-w-[140px]">
                    <span className="text-xs font-bold text-slate-600 px-3 py-1 bg-slate-100 rounded-full">{record.target}</span>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-500 whitespace-nowrap">{record.date}</td>
                  <td className="px-6 py-5 min-w-[160px]">
                    <div className="flex justify-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 w-full ${record.color}`}>
                        {record.status === 'pending' && <Clock className="w-3 h-3" />}
                        {record.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {record.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                        {record.statusLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right space-x-1 min-w-[120px]">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Xem chi tiết">
                      <Eye className="w-5 h-5" />
                    </button>
                    {record.status === 'draft' && (
                      <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Chỉnh sửa">
                        <Edit3 className="w-5 h-5" />
                      </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Xóa">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State Mock */}
        {records.length === 0 && (
          <div className="p-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Chưa có hồ sơ nào</h3>
            <p className="text-slate-500 max-w-xs mt-2 font-medium">Bạn chưa thực hiện đăng ký danh hiệu nào. Hãy bắt đầu hồ sơ đầu tiên ngay!</p>
            <button className="mt-6 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200">Đăng ký ngay</button>
          </div>
        )}

        {/* Footer info */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
          <p>Hiển thị {records.length} trên {records.length} hồ sơ gần nhất</p>
          <div className="flex items-center gap-2">
            <button className="p-1 px-2 hover:text-indigo-600 font-bold opacity-50 cursor-not-allowed">Trước</button>
            <button className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center">1</button>
            <button className="p-1 px-2 hover:text-indigo-600 font-bold opacity-50 cursor-not-allowed">Sau</button>
          </div>
        </div>
      </div>

    </div>
  );
}
