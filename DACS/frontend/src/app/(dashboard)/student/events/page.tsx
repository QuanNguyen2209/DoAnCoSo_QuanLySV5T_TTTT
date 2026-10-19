"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/authStore";
import { eventService, EventItem } from "@/services/eventService";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  Search,
  Loader2,
  CalendarCheck,
  AlertCircle,
  Award,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: "Bản nháp", cls: "bg-slate-100 text-slate-600" },
    published: { label: "Đang mở", cls: "bg-emerald-50 text-emerald-700" },
    closed: { label: "Đã đóng", cls: "bg-red-50 text-red-600" },
  };
  const s = map[status] || map.draft;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

function RegistrationBadge({ status }: { status: string | undefined }) {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    registered: { label: "Đã đăng ký", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
    attended: { label: "Đã điểm danh ✓", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    cancelled: { label: "Đã hủy", cls: "bg-slate-100 text-slate-500" },
  };
  const s = map[status] || { label: status, cls: "bg-slate-100 text-slate-500" };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function StudentEventsPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [attendanceCode, setAttendanceCode] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await eventService.getAll("published");
      setEvents(data);
    } catch {
      console.error("Không thể tải danh sách sự kiện");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const loadEventDetail = async (id: number) => {
    try {
      setDetailLoading(true);
      setMessage(null);
      setAttendanceCode("");
      const data = await eventService.getById(id);
      setSelectedEvent(data);
    } catch {
      setMessage({ type: "error", text: "Không thể tải chi tiết sự kiện" });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      const res = await eventService.register(selectedEvent.id);
      setMessage({ type: "success", text: res.message || "Đăng ký thành công!" });
      await loadEventDetail(selectedEvent.id);
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Đã xảy ra lỗi" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!selectedEvent) return;
    try {
      setActionLoading(true);
      const res = await eventService.cancelRegistration(selectedEvent.id);
      setMessage({ type: "success", text: res.message || "Đã hủy đăng ký" });
      await loadEventDetail(selectedEvent.id);
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Đã xảy ra lỗi" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEvent || !attendanceCode.trim()) return;
    try {
      setActionLoading(true);
      const res = await eventService.checkIn(selectedEvent.id, attendanceCode.trim());
      setMessage({ type: "success", text: res.message || "Điểm danh thành công!" });
      setAttendanceCode("");
      await loadEventDetail(selectedEvent.id);
      fetchEvents();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Mã không hợp lệ" });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const reg = selectedEvent?.my_registration;

  // Criteria grouped by type
  const sv5tCriteria = (selectedEvent?.criteria || []).filter(
    (c) => c.loai_doi_tuong === "individual" || !c.loai_doi_tuong
  );
  const ttttCriteria = (selectedEvent?.criteria || []).filter(
    (c) => c.loai_doi_tuong === "collective"
  );

  return (
    <div className="flex h-full">
      {/* ── Danh sách bên trái ── */}
      <div className="w-[440px] border-r border-slate-100 flex flex-col shrink-0 bg-white">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-500" />
            Sự kiện
          </h1>
          <p className="text-xs text-slate-500">Đăng ký tham gia, điểm danh và tích lũy tiêu chí SV5T</p>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-slate-50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40 text-indigo-500" />
              <p className="text-sm font-medium">Hiện không có sự kiện nào đang mở</p>
            </div>
          ) : (
            filtered.map((event) => (
              <button
                key={event.id}
                onClick={() => loadEventDetail(event.id)}
                className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-all group ${
                  selectedEvent?.id === event.id
                    ? "bg-indigo-50/50 border-l-[3px] border-l-indigo-500"
                    : "border-l-[3px] border-l-transparent"
                }`}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0 overflow-hidden relative">
                    {event.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <CalendarCheck className="w-6 h-6 text-white/50" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <RegistrationBadge status={event.my_registration?.status} />
                      {event.is_attendance_open && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">
                          Điểm danh mở
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 text-sm truncate">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {dayjs(event.start_time).format("DD/MM HH:mm")}
                      </span>
                      {event.location && (
                        <span className="truncate flex items-center gap-1 text-slate-400">
                          • {event.location}
                        </span>
                      )}
                    </div>

                    {/* Criteria tag count */}
                    {event.criteria && event.criteria.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <Award className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="text-[10px] text-indigo-600 font-semibold truncate">
                          Ghi nhận {event.criteria.length} tiêu chí
                        </span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 self-center shrink-0" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Chi tiết bên phải ── */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        {!selectedEvent ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Calendar className="w-14 h-14 mx-auto mb-4 opacity-30 text-indigo-500" />
              <p className="text-sm font-medium">Chọn một sự kiện bên trái để xem chi tiết</p>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="p-8 max-w-3xl space-y-6">
            {/* Thông báo */}
            {message && (
              <div
                className={`p-4 rounded-xl text-sm font-medium flex items-start gap-2 shadow-sm ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {message.text}
              </div>
            )}

            {/* Banner lớn */}
            {selectedEvent.image_url && (
              <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedEvent.image_url}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            )}

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={selectedEvent.status} />
                <RegistrationBadge status={reg?.status} />
                {selectedEvent.is_attendance_open && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                    Điểm danh đang mở
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 leading-snug">{selectedEvent.title}</h2>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Thời gian bắt đầu</p>
                <p className="text-sm font-semibold text-slate-800">
                  {dayjs(selectedEvent.start_time).format("HH:mm — DD/MM/YYYY")}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Thời gian kết thúc</p>
                <p className="text-sm font-semibold text-slate-800">
                  {dayjs(selectedEvent.end_time).format("HH:mm — DD/MM/YYYY")}
                </p>
              </div>
              {selectedEvent.location && (
                <div className="bg-white rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Địa điểm</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedEvent.location}</p>
                </div>
              )}
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Số lượng tham gia</p>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedEvent.registered_count}
                  {selectedEvent.max_participants > 0 ? ` / ${selectedEvent.max_participants}` : ""} sinh viên
                </p>
              </div>
            </div>

            {/* Tiêu chí được công nhận */}
            {selectedEvent.criteria && selectedEvent.criteria.length > 0 && (
              <div className="bg-white rounded-2xl border border-indigo-100 p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  Tiêu chí được công nhận khi tham gia
                </div>
                <p className="text-xs text-slate-500">
                  Khi bạn tham gia và được điểm danh thành công tại sự kiện này, hoạt động sẽ tự động phục vụ các tiêu chí sau:
                </p>

                {/* SV5T */}
                {sv5tCriteria.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-blue-600" />
                      Danh hiệu Sinh viên 5 Tốt:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sv5tCriteria.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 font-medium"
                        >
                          <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <span>{c.ten_tieu_chi}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tập thể */}
                {ttttCriteria.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-600" />
                      Danh hiệu Tập thể Tiên tiến:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ttttCriteria.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-start gap-2 p-2.5 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-900 font-medium"
                        >
                          <CheckCircle2 className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                          <span>{c.ten_tieu_chi}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mô tả */}
            {selectedEvent.description && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-700 mb-2">Mô tả sự kiện</h3>
                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {selectedEvent.description}
                </div>
              </div>
            )}

            {/* ── Nút hành động ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              {/* Chưa đăng ký */}
              {(!reg || reg.status === "cancelled") && selectedEvent.status === "published" && (
                <button
                  onClick={handleRegister}
                  disabled={actionLoading}
                  className="w-full py-3.5 rounded-xl bg-[#546fff] text-white font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-5 h-5" />}
                  Đăng ký tham gia ngay
                </button>
              )}

              {/* Đã đăng ký + chưa điểm danh */}
              {reg?.status === "registered" && (
                <>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Bạn đã đăng ký tham gia sự kiện này!
                    </span>
                    <button
                      onClick={handleCancelRegistration}
                      disabled={actionLoading}
                      className="text-xs text-red-600 hover:underline font-semibold"
                    >
                      Hủy đăng ký
                    </button>
                  </div>

                  {/* Form điểm danh khi cổng mở */}
                  {selectedEvent.is_attendance_open ? (
                    <div className="space-y-3 pt-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Cổng điểm danh đang mở — Nhập mã xác thực:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={attendanceCode}
                          onChange={(e) => setAttendanceCode(e.target.value.toUpperCase())}
                          placeholder="Nhập mã (VD: A1B2C3)"
                          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-base font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-slate-50 uppercase"
                          maxLength={10}
                        />
                        <button
                          onClick={handleCheckIn}
                          disabled={actionLoading || !attendanceCode.trim()}
                          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-emerald-100"
                        >
                          {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                          Điểm danh
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center pt-2">
                      Cổng điểm danh chưa mở hoặc đã kết thúc. Vui lòng theo dõi khi sự kiện diễn ra.
                    </p>
                  )}
                </>
              )}

              {/* Đã điểm danh */}
              {reg?.status === "attended" && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
                  <p className="font-bold flex items-center justify-center gap-1.5 text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Điểm danh thành công!
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Đã ghi nhận tham gia lúc: {dayjs(reg.attended_at).format("HH:mm — DD/MM/YYYY")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
