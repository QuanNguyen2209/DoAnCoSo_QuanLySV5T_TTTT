"use client";

import { motion } from "framer-motion";
import { Users, Shield, Database, Settings, UserPlus, Search, MoreVertical, Key, Mail, Trash2 } from "lucide-react";

export default function SystemManagementPage() {
  const users = [
    { id: "CB-001", name: "Nguyễn Văn Admin", role: "Quản trị viên", department: "Phòng CTSV", email: "admin@vnu.edu.vn", status: "active" },
    { id: "CB-015", name: "Trần Cán Bộ", role: "Cán bộ Đoàn", department: "Khoa CNTT", email: "canbo.cntt@vnu.edu.vn", status: "active" },
    { id: "CB-022", name: "Lê Cán Bộ", role: "Cán bộ Hội", department: "Khoa Kinh Tế", email: "canbo.kinhte@vnu.edu.vn", status: "inactive" },
    { id: "SV-192", name: "Phạm Lớp Trưởng", role: "Lớp trưởng", department: "Lớp KHMT2019", email: "loptruong@vnu.edu.vn", status: "active" },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quản lý hệ thống</h1>
          <p className="text-slate-500 font-medium mt-1">Quản trị người dùng, phân quyền và cài đặt chung</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all">
            <Settings className="w-5 h-5" />
            Cài đặt chung
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
            <UserPlus className="w-5 h-5" />
            Thêm tài khoản
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">+12 tuần này</span>
          </div>
          <h3 className="text-3xl font-black mb-1">5,204</h3>
          <p className="text-indigo-100 font-medium text-sm">Tổng tài khoản hoạt động</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-3xl">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-1">15</h3>
          <p className="text-slate-500 font-medium text-sm">Cán bộ xét duyệt</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-3xl">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
            <Database className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-1">2.4 GB</h3>
          <p className="text-slate-500 font-medium text-sm">Dung lượng lưu trữ minh chứng</p>
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-bold text-slate-900 text-lg">Danh sách người dùng</h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm kiếm tài khoản..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <select className="px-4 py-2 bg-slate-50 border border-transparent rounded-xl text-sm font-bold text-slate-600 focus:bg-white focus:border-indigo-500 outline-none">
              <option>Tất cả vai trò</option>
              <option>Quản trị viên</option>
              <option>Cán bộ</option>
              <option>Lớp trưởng</option>
              <option>Sinh viên</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Người dùng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Phòng / Lớp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={user.id} 
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{user.name}</span>
                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {user.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-block
                      ${user.role === 'Quản trị viên' ? 'bg-purple-100 text-purple-700' : 
                        user.role.includes('Cán bộ') ? 'bg-blue-100 text-blue-700' : 
                        user.role === 'Lớp trưởng' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-700'}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">{user.department}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                      <span className={`text-xs font-bold ${user.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Phân quyền">
                        <Key className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Khóa tài khoản">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
