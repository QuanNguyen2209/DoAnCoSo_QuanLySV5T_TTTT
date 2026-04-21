"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Users, Shield, Database, UserPlus, Search, Key, Mail, Trash2, Loader2, X, CheckCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";

interface User {
  id: number;
  ho_ten: string;
  email: string;
  ma_sv: string | null;
  role: string;
  avatar_url: string | null;
}

const roleLabels: Record<string, string> = {
  sinh_vien: "Sinh viên", lop_truong: "Lớp trưởng", can_bo: "Cán bộ Đoàn", admin: "Quản trị viên",
};
const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700", can_bo: "bg-blue-100 text-blue-700",
  lop_truong: "bg-orange-100 text-orange-700", sinh_vien: "bg-slate-100 text-slate-700",
};

export default function SystemManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleModal, setRoleModal] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const [changingRole, setChangingRole] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await api.get("/users", { params });
      if (res.data.success) setUsers(res.data.data || []);
    } catch { } finally { setLoading(false); }
  }, [roleFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openRoleModal = (user: User) => {
    setRoleModal(user);
    setNewRole(user.role);
    setSuccessMsg("");
  };

  const handleChangeRole = async () => {
    if (!roleModal) return;
    setChangingRole(true);
    try {
      await api.put(`/auth/change-role/${roleModal.id}`, { role: newRole });
      setSuccessMsg(`Đã cập nhật quyền "${roleLabels[newRole]}" cho ${roleModal.ho_ten}`);
      fetchUsers();
      setTimeout(() => { setRoleModal(null); setSuccessMsg(""); }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.error || "Lỗi khi phân quyền");
    } finally { setChangingRole(false); }
  };

  // Stats
  const stats = {
    total: users.length,
    canBo: users.filter(u => u.role === "can_bo").length,
    admin: users.filter(u => u.role === "admin").length,
    lopTruong: users.filter(u => u.role === "lop_truong").length,
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Quản lý hệ thống</h1>
          <p className="text-slate-500 font-medium mt-1">Quản trị người dùng, phân quyền và cài đặt chung</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-indigo-200">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-black mb-1">{stats.total}</h3>
          <p className="text-indigo-100 font-medium text-sm">Tổng tài khoản</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-3xl">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-1">{stats.admin}</h3>
          <p className="text-slate-500 font-medium text-sm">Quản trị viên</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-3xl">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-1">{stats.canBo}</h3>
          <p className="text-slate-500 font-medium text-sm">Cán bộ xét duyệt</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-3xl">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
            <Database className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-1">{stats.lopTruong}</h3>
          <p className="text-slate-500 font-medium text-sm">Lớp trưởng</p>
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
                type="text" placeholder="Tìm kiếm tài khoản..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-transparent rounded-xl text-sm font-bold text-slate-600 focus:bg-white focus:border-indigo-500 outline-none">
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="can_bo">Cán bộ</option>
              <option value="lop_truong">Lớp trưởng</option>
              <option value="sinh_vien">Sinh viên</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-slate-400 font-medium">Không tìm thấy người dùng</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Người dùng</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Mã SV</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Vai trò</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user, i) => (
                  <motion.tr
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    key={user.id} className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-400">#{user.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                          {user.ho_ten?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">{user.ho_ten}</span>
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{user.ma_sv || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-block ${roleColors[user.role] || "bg-slate-100 text-slate-700"}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => openRoleModal(user)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Phân quyền">
                        <Key className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      <AnimatePresence>
        {roleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRoleModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">Phân quyền</h2>
                <button onClick={() => setRoleModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              {successMsg ? (
                <div className="flex flex-col items-center py-6">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                  <p className="text-lg font-bold text-emerald-700 text-center">{successMsg}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                      {roleModal.ho_ten?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{roleModal.ho_ten}</p>
                      <p className="text-sm text-slate-500">{roleModal.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Chọn vai trò mới</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["sinh_vien", "lop_truong", "can_bo", "admin"] as const).map(role => (
                        <button key={role} onClick={() => setNewRole(role)}
                          className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                            newRole === role ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}>
                          {roleLabels[role]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8">
                    <button onClick={() => setRoleModal(null)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Hủy</button>
                    <button onClick={handleChangeRole} disabled={changingRole || newRole === roleModal.role}
                      className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                      {changingRole && <Loader2 className="w-4 h-4 animate-spin" />}
                      Cập nhật quyền
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
