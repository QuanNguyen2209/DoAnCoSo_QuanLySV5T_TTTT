"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Loader2,
  RefreshCw
} from "lucide-react";
import { studentService, Application } from "@/services/studentService";

export default function StudentRecordsPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await studentService.getRecords(1); // Mock user ID 1
      setRecords(data);
    } catch (error) {
      console.error("Failed to load records", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản nháp này không?")) return;
    try {
      await studentService.deleteDraft(id);
      setRecords(records.filter(r => r.id !== id));
      alert("Đã xóa bản nháp thành công.");
    } catch (error: any) {
      alert(error.response?.data?.error || "Không thể xóa hồ sơ này.");
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'reviewing': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'rejected': return 'bg-rose-100 text-rose-600 border-rose-200';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'approved': return 'Đã duyệt';
      case 'pending': return 'Đang chờ duyệt';
      case 'reviewing': return 'Đang xét duyệt';
      case 'rejected': return 'Cần bổ sung';
      case 'draft': return 'Bản nháp';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'approved': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'pending': return <Clock className="w-3.5 h-3.5" />;
      case 'reviewing': return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
      case 'rejected': return <AlertCircle className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const filteredRecords = records.filter(r => 
    r.ma_ho_so.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.loai_doi_tuong === 'individual' ? 'Sinh viên 5 Tốt' : 'Tập thể Tiên tiến').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1200px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hồ sơ của tôi</h1>
          <p className="text-slate-500 font-medium mt-1">Theo dõi trạng thái và lịch sử nộp hồ sơ xét duyệt</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm hồ sơ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 outline-none w-64"
            />
          </div>
          <button 
            onClick={fetchRecords}
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-5 h-5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
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
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Danh hiệu / Đối tượng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Kỳ xét duyệt</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách hồ sơ...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">
                    Không tìm thấy hồ sơ nào.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={record.id} 
                    className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                  >
                    <td className="px-6 py-5 font-bold text-slate-400 text-sm">#{record.ma_ho_so}</td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-900 text-sm block">
                        {record.loai_doi_tuong === 'individual' ? "Sinh viên 5 Tốt" : "Tập thể Tiên tiến"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wide">
                        {record.ngay_nop ? `Nộp ngày: ${new Date(record.ngay_nop).toLocaleDateString('vi-VN')}` : "Chưa nộp"}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-slate-600 text-sm">
                      {record.ky_xet_duyet?.ten_ky || "N/A"}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 whitespace-nowrap ${getStatusStyle(record.trang_thai)}`}>
                          {getStatusIcon(record.trang_thai)}
                          {getStatusLabel(record.trang_thai)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                        {record.trang_thai === 'draft' && (
                          <>
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors" title="Chỉnh sửa">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(record.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors" 
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
