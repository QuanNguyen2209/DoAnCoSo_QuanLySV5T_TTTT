"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  eventService,
  EventItem,
  EventRegistration,
  CreateEventPayload,
  EventCriterion,
} from "@/services/eventService";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Plus,
  Search,
  Loader2,
  CalendarCheck,
  AlertCircle,
  Trash2,
  Eye,
  Copy,
  X,
  Key,
  Lock,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Award,
  Sparkles,
  Layers,
  UploadCloud,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

// ── Sub-components ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Bản nháp", cls: "bg-slate-100 text-slate-600 border border-slate-200" },
    published: { label: "Đang mở", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    closed: { label: "Đã đóng", cls: "bg-red-50 text-red-600 border border-red-200" },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

function RegStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    registered: { label: "Đã đăng ký", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
    attended: { label: "Đã điểm danh", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    cancelled: { label: "Đã hủy", cls: "bg-slate-100 text-slate-500" },
  };
  const s = map[status] || { label: status, cls: "bg-slate-100 text-slate-500" };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ── Tab type ────────────────────────────────────────────────────

type Tab = "list" | "create" | "attendance";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [criteria, setCriteria] = useState<EventCriterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("list");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Criteria tab in form: 'individual' (SV5T) or 'collective' (TTTT)
  const [activeCriteriaType, setActiveCriteriaType] = useState<"individual" | "collective">("individual");

  // Create form
  const [form, setForm] = useState<CreateEventPayload>({
    title: "",
    description: "",
    location: "",
    image_url: "",
    criteria_ids: [],
    start_time: "",
    end_time: "",
    max_participants: 0,
    status: "draft",
  });

  // Upload image state
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Attendance
  const [attendanceList, setAttendanceList] = useState<EventRegistration[]>([]);
  const [attendanceCode, setAttendanceCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expiryMinutes, setExpiryMinutes] = useState(30);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "Kích thước ảnh tối đa là 10MB" });
      return;
    }

    try {
      setUploadingImage(true);
      clearMsg();
      const res = await eventService.uploadBanner(file);
      if (res.success && res.data?.url) {
        setForm((prev) => ({ ...prev, image_url: res.data.url }));
        setMessage({ type: "success", text: "Tải ảnh lên Supabase Storage thành công!" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Lỗi tải ảnh lên" });
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventService.getAll();
      setEvents(data);
    } catch {
      console.error("Lỗi tải sự kiện");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCriteria = useCallback(async () => {
    try {
      const data = await eventService.getCriteria();
      setCriteria(data || []);
    } catch {
      console.error("Lỗi tải danh sách tiêu chí");
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchCriteria();
  }, [fetchEvents, fetchCriteria]);

  const clearMsg = () => setMessage(null);

  // ── Criteria selection helpers ────────────────────────────────

  const selectedIds = form.criteria_ids || [];

  const toggleCriterion = (id: number) => {
    if (selectedIds.includes(id)) {
      setForm({ ...form, criteria_ids: selectedIds.filter((x) => x !== id) });
    } else {
      setForm({ ...form, criteria_ids: [...selectedIds, id] });
    }
  };

  const toggleGroup = (group: EventCriterion) => {
    const childIds = (group.children || []).map((c) => c.id);
    const allSelected = childIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setForm({
        ...form,
        criteria_ids: selectedIds.filter((id) => !childIds.includes(id) && id !== group.id),
      });
    } else {
      const toAdd = [group.id, ...childIds].filter((id) => !selectedIds.includes(id));
      setForm({ ...form, criteria_ids: [...selectedIds, ...toAdd] });
    }
  };

  const sv5tCriteria = criteria.filter((c) => c.loai_doi_tuong === "individual" || !c.loai_doi_tuong);
  const ttttCriteria = criteria.filter((c) => c.loai_doi_tuong === "collective");

  const sv5tSelectedCount = sv5tCriteria.reduce((acc, p) => {
    const cCount = (p.children || []).filter((c) => selectedIds.includes(c.id)).length;
    return acc + cCount + (selectedIds.includes(p.id) ? 1 : 0);
  }, 0);

  const ttttSelectedCount = ttttCriteria.reduce((acc, p) => {
    const cCount = (p.children || []).filter((c) => selectedIds.includes(c.id)).length;
    return acc + cCount + (selectedIds.includes(p.id) ? 1 : 0);
  }, 0);

  // ── CRUD Handlers ─────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.title || !form.start_time || !form.end_time) {
      setMessage({ type: "error", text: "Vui lòng điền đầy đủ: Tên sự kiện, Thời gian bắt đầu và kết thúc" });
      return;
    }
    try {
      setActionLoading(true);
      clearMsg();
      await eventService.create(form);
      setMessage({ type: "success", text: "Tạo sự kiện thành công!" });
      setForm({
        title: "",
        description: "",
        location: "",
        image_url: "",
        criteria_ids: [],
        start_time: "",
        end_time: "",
        max_participants: 0,
        status: "draft",
      });
      setTab("list");
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Lỗi tạo sự kiện" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn xóa sự kiện này?")) return;
    try {
      await eventService.remove(id);
      setMessage({ type: "success", text: "Đã xóa sự kiện" });
      if (selectedEvent?.id === id) {
        setSelectedEvent(null);
        setTab("list");
      }
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Lỗi xóa sự kiện" });
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      setActionLoading(true);
      await eventService.update(id, { status: status as any });
      setMessage({
        type: "success",
        text: `Đã cập nhật trạng thái thành "${status === "published" ? "Đang mở" : status === "closed" ? "Đã đóng" : "Bản nháp"}"`,
      });
      fetchEvents();
      if (selectedEvent?.id === id) {
        const updated = await eventService.getById(id);
        setSelectedEvent(updated);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Lỗi cập nhật" });
    } finally {
      setActionLoading(false);
    }
  };

  // ── Attendance Handlers ───────────────────────────────────────

  const openAttendanceTab = async (event: EventItem) => {
    setSelectedEvent(event);
    setTab("attendance");
    clearMsg();
    setAttendanceCode(event.attendance_code || null);
    setExpiresAt(event.attendance_expires_at || null);
    try {
      const list = await eventService.getAttendanceList(event.id);
      setAttendanceList(list);
    } catch {
      setAttendanceList([]);
    }
  };

  const handleGenerateCode = async () => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      clearMsg();
      const res = await eventService.generateAttendanceCode(selectedEvent.id, expiryMinutes);
      setAttendanceCode(res.data.attendance_code);
      setExpiresAt(res.data.attendance_expires_at);
      setMessage({ type: "success", text: res.message });
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Lỗi sinh mã" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseAttendance = async () => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      const res = await eventService.closeAttendance(selectedEvent.id);
      setAttendanceCode(null);
      setExpiresAt(null);
      setMessage({ type: "success", text: res.message });
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Lỗi đóng điểm danh" });
    } finally {
      setActionLoading(false);
    }
  };

  const copyCode = () => {
    if (attendanceCode) {
      navigator.clipboard.writeText(attendanceCode);
      setMessage({ type: "success", text: "Đã sao chép mã điểm danh!" });
    }
  };

  // ── Filtering ─────────────────────────────────────────────────

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const attendedCount = attendanceList.filter((r) => r.status === "attended").length;
  const registeredCount = attendanceList.filter((r) => r.status !== "cancelled").length;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between shadow-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {message.text}
          </span>
          <button onClick={clearMsg} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-500" />
            Quản lý Sự kiện
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tạo sự kiện, gắn tiêu chí SV5T & Tập thể tiên tiến và quản lý điểm danh
          </p>
        </div>
        {tab !== "create" && (
          <button
            onClick={() => {
              setTab("create");
              clearMsg();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#546fff] text-white font-semibold hover:bg-indigo-600 transition-all shadow-md shadow-indigo-100 shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tạo sự kiện mới
          </button>
        )}
      </div>

      {/* ── Tab: Create ── */}
      {tab === "create" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tạo sự kiện mới</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập thông tin chung, ảnh đại diện và tiêu chí công nhận
              </p>
            </div>
            <button onClick={() => setTab("list")} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* 1. Thông tin chung */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                1. Thông tin sự kiện
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Tên sự kiện *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    placeholder="VD: Hội thảo Công nghệ AI & Sinh viên 5 Tốt 2026"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Địa điểm</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    placeholder="VD: Hội trường A, Khu E - HUTECH"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Giới hạn số lượng tham gia</label>
                  <input
                    type="number"
                    value={form.max_participants || ""}
                    onChange={(e) => setForm({ ...form, max_participants: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    placeholder="0 = Không giới hạn"
                    min={0}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Trạng thái phát hành</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white"
                  >
                    <option value="draft">Bản nháp (Chỉ Admin thấy)</option>
                    <option value="published">Công khai (Mở cho Sinh viên đăng ký)</option>
                    <option value="closed">Đã đóng</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
                    placeholder="Mô tả nội dung chương trình, quyền lợi khi tham gia..."
                  />
                </div>
              </div>
            </div>

            {/* 2. Ảnh sự kiện (Banner) */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                2. Hình ảnh Banner sự kiện
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Tải ảnh banner sự kiện từ máy tính của bạn (tự động lưu trữ trên Supabase Storage)
              </p>

              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!form.image_url ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/20 hover:bg-indigo-50/50 hover:border-indigo-400 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                      {uploadingImage ? (
                        <Loader2 className="w-7 h-7 animate-spin" />
                      ) : (
                        <UploadCloud className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {uploadingImage ? "Đang tải ảnh lên Supabase Storage..." : "Bấm để chọn file ảnh từ máy tính"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Hỗ trợ định dạng JPG, PNG, WEBP, GIF (Dung lượng tối đa 10MB)
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={uploadingImage}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                      {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                      {uploadingImage ? "Đang xử lý..." : "Chọn ảnh từ máy"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Ảnh đã tải lên Supabase Storage thành công
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> Thay đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image_url: "" })}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
                        </button>
                      </div>
                    </div>

                    <div className="relative w-full h-52 sm:h-64 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.image_url}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                        <span className="text-white text-xs font-semibold px-2.5 py-1 rounded-md bg-black/40 backdrop-blur-sm">
                          {form.title || "Tên sự kiện"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Thiết lập Tiêu chí công nhận (SV5T & Tập thể) */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-500" />
                    3. Thiết lập Tiêu chí công nhận
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Khi sinh viên tham gia và điểm danh sự kiện này, họ sẽ được ghi nhận vào các tiêu chí sau:
                  </p>
                </div>
                {/* Badge đếm tiêu chí */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                    SV5T: {sv5tSelectedCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                    Tập thể: {ttttSelectedCount}
                  </span>
                </div>
              </div>

              {/* Tabs phân loại tiêu chí */}
              <div className="flex border-b border-slate-200 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveCriteriaType("individual")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                    activeCriteriaType === "individual"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Sinh viên 5 Tốt (Cá nhân)
                  {sv5tSelectedCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
                      {sv5tSelectedCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCriteriaType("collective")}
                  className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                    activeCriteriaType === "collective"
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Tập thể Tiên tiến
                  {ttttSelectedCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">
                      {ttttSelectedCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Danh sách tiêu chí theo nhóm */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                {(activeCriteriaType === "individual" ? sv5tCriteria : ttttCriteria).length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-6">Đang tải danh sách tiêu chí...</p>
                ) : (
                  (activeCriteriaType === "individual" ? sv5tCriteria : ttttCriteria).map((parent) => {
                    const children = parent.children || [];
                    const allChildSelected =
                      children.length > 0 && children.every((c) => selectedIds.includes(c.id));
                    return (
                      <div key={parent.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        {/* Parent Header */}
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                          <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-800 text-sm">
                            <input
                              type="checkbox"
                              checked={children.length > 0 ? allChildSelected : selectedIds.includes(parent.id)}
                              onChange={() => (children.length > 0 ? toggleGroup(parent) : toggleCriterion(parent.id))}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-400 cursor-pointer"
                            />
                            <span>{parent.ten_tieu_chi}</span>
                          </label>
                          {children.length > 0 && (
                            <span className="text-xs text-slate-400">
                              {children.filter((c) => selectedIds.includes(c.id)).length}/{children.length} đã chọn
                            </span>
                          )}
                        </div>

                        {/* Children List */}
                        {children.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pl-6">
                            {children.map((child) => {
                              const isChecked = selectedIds.includes(child.id);
                              return (
                                <label
                                  key={child.id}
                                  className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                    isChecked
                                      ? "bg-indigo-50/60 border-indigo-200 text-indigo-900 font-medium"
                                      : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCriterion(child.id)}
                                    className="w-3.5 h-3.5 mt-0.5 text-indigo-600 rounded focus:ring-indigo-400 cursor-pointer shrink-0"
                                  />
                                  <span className="leading-snug">{child.ten_tieu_chi}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Form action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setTab("list")}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleCreate}
              disabled={actionLoading}
              className="px-6 py-2.5 rounded-xl bg-[#546fff] text-white font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-indigo-100"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu & Tạo sự kiện
            </button>
          </div>
        </div>
      )}

      {/* ── Tab: List ── */}
      {tab === "list" && (
        <>
          <div className="mb-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện theo tên hoặc địa điểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-slate-50"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200 p-8">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
              <p className="font-semibold text-slate-700">Chưa có sự kiện nào</p>
              <p className="text-sm mt-1">Bấm nút &quot;Tạo sự kiện mới&quot; ở trên để bắt đầu thêm sự kiện</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-100 transition-all flex flex-col group"
                >
                  {/* Banner Image */}
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                    {event.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center">
                        <CalendarCheck className="w-12 h-12 text-white/40" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <StatusBadge status={event.status} />
                    </div>
                    {event.is_attendance_open && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1 animate-pulse">
                        <Key className="w-3 h-3" /> Đang điểm danh
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base mb-2 line-clamp-2 leading-snug">
                        {event.title}
                      </h3>

                      {/* Tiêu chí gắn liền */}
                      {event.criteria && event.criteria.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {event.criteria.slice(0, 3).map((crit) => (
                            <span
                              key={crit.id}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                                crit.loai_doi_tuong === "collective"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {crit.loai_doi_tuong === "collective" ? "👥 TTTT" : "🎓 SV5T"}: {crit.ten_tieu_chi}
                            </span>
                          ))}
                          {event.criteria.length > 3 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              +{event.criteria.length - 3} khác
                            </span>
                          )}
                        </div>
                      )}

                      <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>
                            {dayjs(event.start_time).format("DD/MM/YYYY HH:mm")} – {dayjs(event.end_time).format("HH:mm")}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span>
                            {event.registered_count}
                            {event.max_participants > 0 ? ` / ${event.max_participants}` : ""} sinh viên đã đăng ký
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => openAttendanceTab(event)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Điểm danh
                      </button>
                      {event.status === "draft" && (
                        <button
                          onClick={() => handleUpdateStatus(event.id, "published")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mở đăng ký
                        </button>
                      )}
                      {event.status === "published" && (
                        <button
                          onClick={() => handleUpdateStatus(event.id, "closed")}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Đóng
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Xóa sự kiện"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Attendance ── */}
      {tab === "attendance" && selectedEvent && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTab("list");
                clearMsg();
              }}
              className="text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              ← Quay lại danh sách
            </button>
            <span className="text-slate-300">|</span>
            <h2 className="text-lg font-bold text-slate-800 truncate">{selectedEvent.title}</h2>
          </div>

          {/* Banner & Event quick info */}
          {selectedEvent.image_url && (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedEvent.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{selectedEvent.title}</h3>
                  <p className="text-xs text-white/80">
                    {dayjs(selectedEvent.start_time).format("DD/MM/YYYY HH:mm")} – {selectedEvent.location}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Criteria info */}
          {selectedEvent.criteria && selectedEvent.criteria.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" />
                Tiêu chí được công nhận từ sự kiện này:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedEvent.criteria.map((c) => (
                  <span
                    key={c.id}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
                      c.loai_doi_tuong === "collective"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {c.loai_doi_tuong === "collective" ? "👥 Tập thể:" : "🎓 SV5T:"} {c.ten_tieu_chi}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Attendance code panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-500" />
              Mã điểm danh
            </h3>

            {attendanceCode ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 text-center border border-indigo-100">
                  <p className="text-xs text-indigo-500 font-bold tracking-wider mb-2">MÃ ĐIỂM DANH HIỆN TẠI</p>
                  <p className="text-4xl font-black text-indigo-700 tracking-[0.4em] mb-3">{attendanceCode}</p>
                  {expiresAt && (
                    <p className="text-xs text-amber-600 font-medium">
                      ⏳ Hết hạn lúc: {dayjs(expiresAt).format("HH:mm — DD/MM/YYYY")}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={copyCode}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Sao chép mã
                  </button>
                  <button
                    onClick={handleGenerateCode}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    <Key className="w-4 h-4" /> Sinh mã mới
                  </button>
                  <button
                    onClick={handleCloseAttendance}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" /> Đóng cổng điểm danh
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Cổng điểm danh hiện đang đóng. Hãy thiết lập thời hạn và bấm sinh mã để sinh viên điểm danh:
                </p>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Thời hạn mã (phút)</label>
                    <input
                      type="number"
                      value={expiryMinutes}
                      onChange={(e) => setExpiryMinutes(parseInt(e.target.value) || 30)}
                      min={5}
                      max={1440}
                      className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <button
                    onClick={handleGenerateCode}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#546fff] text-white font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 mt-5 shadow-md shadow-indigo-100"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    Mở cổng & Sinh mã
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Attendance list */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Danh sách Đăng ký & Điểm danh
              </h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-emerald-600 font-semibold">{attendedCount} đã điểm danh</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{registeredCount} đã đăng ký</span>
              </div>
            </div>

            {attendanceList.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Chưa có ai đăng ký sự kiện này</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 py-3 px-3">#</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-3 px-3">MSSV</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-3 px-3">Họ tên</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-3 px-3">Email</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-3 px-3">Trạng thái</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-3 px-3">Đăng ký lúc</th>
                      <th className="text-left text-xs font-semibold text-slate-500 py-3 px-3">Điểm danh lúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceList.map((reg, i) => (
                      <tr key={reg.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-sm text-slate-400">{i + 1}</td>
                        <td className="py-3 px-3 text-sm font-medium text-slate-700">{reg.student?.ma_sv || "—"}</td>
                        <td className="py-3 px-3 text-sm text-slate-700 font-semibold">{reg.student?.ho_ten || "—"}</td>
                        <td className="py-3 px-3 text-sm text-slate-500">{reg.student?.email || "—"}</td>
                        <td className="py-3 px-3">
                          <RegStatusBadge status={reg.status} />
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500">
                          {dayjs(reg.registered_at).format("HH:mm DD/MM")}
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-500">
                          {reg.attended_at ? dayjs(reg.attended_at).format("HH:mm DD/MM") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
