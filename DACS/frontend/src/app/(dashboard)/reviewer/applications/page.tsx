"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle, XCircle, AlertCircle, Inbox, Loader2, Eye, FileText } from "lucide-react";
import { reviewerService, ReviewApplication } from "@/services/reviewerService";
import Link from "next/link";

export default function ReviewerApplicationsPage() {
  const [applications, setApplications] = useState<ReviewApplication[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [filter, selectedClass]);

  const fetchInitialData = async () => {
    try {
      const classes = await reviewerService.getAssignedClasses();
      setAssignedClasses(classes || []);
      await fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const params: any = {};
      if (filter !== "all") params.trang_thai = filter;
      if (selectedClass !== "all") params.lop_id = selectedClass;
      if (search) params.search = search;
      const data = await reviewerService.getApplications(params);
      setApplications(data);
    } catch (err: any) {
      setError("Không thể tải danh sách hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  // Tính thống kê nhanh từ dữ liệu đã tải
  const stats = {
    pending: applications.filter(a => a.trang_thai === "pending").length,
    approved: applications.filter(a => a.trang_thai === "approved").length,
    rejected: applications.filter(a => a.trang_thai === "rejected").length,
    reviewing: applications.filter(a => a.trang_thai === "reviewing").length,
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Chờ duyệt", color: "bg-orange-100 text-orange-600" },
    reviewing: { label: "Đang duyệt", color: "bg-blue-100 text-blue-600" },
    approved: { label: "Đã duyệt", color: "bg-emerald-100 text-emerald-600" },
    rejected: { label: "Từ chối", color: "bg-rose-100 text-rose-600" },
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Xét duyệt hồ sơ</h1>
          <p className="text-slate-500 font-medium mt-1">Hệ thống xử lý hồ sơ đăng ký dành cho Cán bộ Đoàn - Hội</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4"><Inbox className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-slate-900">{stats.pending + stats.reviewing}</div>
          <div className="text-sm font-bold text-slate-500">Cần xét duyệt</div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4"><CheckCircle className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-slate-900">{stats.approved}</div>
          <div className="text-sm font-bold text-slate-500">Đã thông qua</div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4"><XCircle className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-slate-900">{stats.rejected}</div>
          <div className="text-sm font-bold text-slate-500">Bị từ chối</div>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-3xl">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4"><AlertCircle className="w-5 h-5" /></div>
          <div className="text-3xl font-black text-slate-900">{applications.length}</div>
          <div className="text-sm font-bold text-slate-500">Tổng hồ sơ</div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="font-bold text-slate-900 text-lg">Danh sách hồ sơ</h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all min-w-[150px]"
            >
              <option value="all">Tất cả lớp quản lý</option>
              {assignedClasses.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.ma_lop} - {cls.ten_lop}</option>
              ))}
            </select>

            {/* Status Filter Tabs */}
            {[
              { key: "all", label: "Tất cả" },
              { key: "pending", label: "Chờ duyệt" },
              { key: "approved", label: "Đã duyệt" },
              { key: "rejected", label: "Từ chối" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  filter === tab.key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Search */}
            <form onSubmit={handleSearch} className="relative ml-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, MSSV..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={fetchApplications}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none w-52 transition-all"
              />
            </form>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 font-medium">{error}</div>
        ) : applications.length === 0 ? (
          <div className="p-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Không có hồ sơ nào</h3>
            <p className="text-slate-500 max-w-xs mt-2 font-medium">
              {filter === "all"
                ? "Chưa có hồ sơ nào được nộp trong các lớp bạn quản lý."
                : `Không có hồ sơ ở trạng thái "${statusConfig[filter]?.label}" .`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Người nộp</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Đơn vị (Lớp/Khoa)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Danh hiệu</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Minh chứng</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-900 text-sm block">{app.users?.ho_ten || "—"}</span>
                      <span className="text-[10px] font-bold text-slate-400 tracking-wide">
                        MSSV: {app.users?.ma_sv || ""} • #{app.ma_ho_so}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-xs block w-fit mb-1">
                        {app.users?.lop_hoc?.ma_lop || "—"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        Khoa {app.users?.lop_hoc?.khoa?.ten_khoa || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-slate-600 text-sm">
                        {app.loai_doi_tuong === "individual" ? "Sinh viên 5 Tốt" : "Tập thể Tiên tiến"}
                      </span>
                      <span className="block text-[10px] font-bold text-indigo-500 tracking-wide">
                        {app.ky_xet_duyet?.ten_ky || ""}
                      </span>
                    </td>
                    <td className="px-6 py-5 font-black text-indigo-600">
                      {app.minh_chung?.length || 0} mục
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig[app.trang_thai]?.color || "bg-slate-100 text-slate-500"}`}>
                          {statusConfig[app.trang_thai]?.label || app.trang_thai}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/reviewer/applications/${app.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-sm rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        Chấm hồ sơ
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && applications.length > 0 && (
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
            <p>Hiển thị {applications.length} hồ sơ</p>
          </div>
        )}
      </div>
    </div>
  );
}
