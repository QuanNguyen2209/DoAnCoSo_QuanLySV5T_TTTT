"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { reviewerService } from "@/services/reviewerService";
import {
  ArrowLeft, User, Phone, BookOpen, Briefcase, Flag,
  CheckCircle2, XCircle, Loader2, FileText, ExternalLink,
  Clock, AlertCircle, Shield, Mail, Send, FileDown
} from "lucide-react";
import api from "@/lib/axios";

export default function ReviewApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showModal, setShowModal] = useState<"approved" | "rejected" | "email" | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await reviewerService.getApplicationDetail(id);
      setData(res);
    } catch {
      setResultMsg("Không thể tải chi tiết hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!showModal) return;
    try {
      setReviewing(true);
      const res = await reviewerService.reviewApplication(id, showModal as any, feedback);
      setResultMsg(res.message);
      setShowModal(null);
      setFeedback("");
      fetchDetail(); // reload
    } catch {
      setResultMsg("Lỗi khi xử lý hồ sơ.");
    } finally {
      setReviewing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !feedback.trim()) {
      setResultMsg("Vui lòng nhập cả tiêu đề và nội dung email.");
      return;
    }
    try {
      setReviewing(true);
      const res = await reviewerService.sendEmail(id, emailSubject, feedback);
      setResultMsg(res.message || "Gửi email thành công.");
      setTimeout(() => {
        setShowModal(null);
        setFeedback("");
        setEmailSubject("");
        setResultMsg("");
      }, 2000);
    } catch (err: any) {
      setResultMsg(err.response?.data?.error || "Lỗi khi gửi email.");
    } finally {
      setReviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">Không tìm thấy hồ sơ.</div>
    );
  }

  const student = data.users;
  const profile = data.user_profile || {};
  const minhChungList = data.minh_chung || [];
  const lichSu = data.lich_su_ho_so || [];
  const canReview = ["pending", "reviewing"].includes(data.trang_thai);

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: "Chờ duyệt", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Clock },
    reviewing: { label: "Đang duyệt", color: "bg-blue-100 text-blue-700 border-blue-200", icon: AlertCircle },
    approved: { label: "Đã phê duyệt", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    rejected: { label: "Đã từ chối", color: "bg-rose-100 text-rose-700 border-rose-200", icon: XCircle },
  };
  const currentStatus = statusConfig[data.trang_thai] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/reviewer/applications")} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setExportingPDF(true);
              try {
                const res = await api.get(`/pdf/ho-so/${id}`, { responseType: 'blob' });
                const url = URL.createObjectURL(res.data);
                const a = document.createElement('a');
                a.href = url;
                a.download = `BanGioiThieu_${data?.ma_ho_so || 'HoSo'}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch { alert('Lỗi khi xuất PDF'); } finally { setExportingPDF(false); }
            }}
            disabled={exportingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-sm disabled:opacity-50"
          >
            {exportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} Xuất PDF
          </button>
          <button onClick={() => { setShowModal("email"); setFeedback(""); setEmailSubject(""); setResultMsg(""); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-sm">
            <Mail className="w-4 h-4" /> Gửi Email cho SV
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                {student?.avatar_url ? (
                  <img src={student.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{student?.ho_ten}</h1>
                <p className="text-indigo-100 text-sm font-medium">
                  MSSV: {student?.ma_sv} • {student?.lop_hoc?.ma_lop} • {student?.lop_hoc?.khoa?.ten_khoa}
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border ${currentStatus.color}`}>
              <StatusIcon className="w-4 h-4" />
              {currentStatus.label}
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-slate-400 font-medium block">Mã hồ sơ</span><span className="font-bold text-slate-800">#{data.ma_ho_so}</span></div>
          <div><span className="text-slate-400 font-medium block">Loại</span><span className="font-bold text-slate-800">{data.loai_doi_tuong === "individual" ? "Sinh viên 5 Tốt" : "Tập thể Tiên tiến"}</span></div>
          <div><span className="text-slate-400 font-medium block">Ngày nộp</span><span className="font-bold text-slate-800">{data.ngay_nop ? new Date(data.ngay_nop).toLocaleDateString("vi-VN") : "—"}</span></div>
          <div><span className="text-slate-400 font-medium block">Kỳ xét duyệt</span><span className="font-bold text-slate-800">{data.ky_xet_duyet?.ten_ky}</span></div>
        </div>
      </div>

      {/* E-Profile Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User className="w-5 h-5" /></div>
          <h2 className="text-lg font-semibold text-slate-800">Thông tin E-Profile</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <InfoItem label="Giới tính" value={profile.gioi_tinh} />
          <InfoItem label="Ngày sinh" value={profile.ngay_sinh ? new Date(profile.ngay_sinh).toLocaleDateString("vi-VN") : undefined} />
          <InfoItem label="Dân tộc" value={profile.dan_toc} />
          <InfoItem label="SĐT" value={profile.so_dien_thoai} />
          <InfoItem label="Email" value={student?.email} />
          <InfoItem label="Điểm GPA" value={profile.diem_tich_luy} />
          <InfoItem label="Điểm rèn luyện" value={profile.diem_ren_luyen} />
          <InfoItem label="Ngoại ngữ" value={profile.ngoai_ngu} />
          <InfoItem label="Tin học" value={profile.tin_hoc} />
          <InfoItem label="Chức vụ Đoàn-Hội" value={profile.chuc_vu_doan_hoi} />
          <InfoItem label="Đơn vị Đoàn" value={profile.don_vi_doan_truc_thuoc} />
          <InfoItem label="Ngày kết nạp Đoàn" value={profile.ngay_ket_nap_doan ? new Date(profile.ngay_ket_nap_doan).toLocaleDateString("vi-VN") : undefined} />
        </div>
      </div>

      {/* Danh sách Minh chứng */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><FileText className="w-5 h-5" /></div>
          <h2 className="text-lg font-semibold text-slate-800">Minh chứng đã nộp ({minhChungList.length})</h2>
        </div>
        {minhChungList.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-medium">Sinh viên chưa nộp minh chứng nào.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {minhChungList.map((mc: any) => {
              const files = mc.minh_chung_files || [];
              return (
                <div key={mc.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  {/* Tiêu chí badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {mc.tieu_chi?.ten_tieu_chi || `Tiêu chí #${mc.tieu_chi_id}`}
                    </span>
                  </div>

                  {/* Mô tả text từ sinh viên */}
                  {mc.mo_ta && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-3 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 mb-1">Mô tả của sinh viên:</p>
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{mc.mo_ta}</p>
                    </div>
                  )}

                  {/* Gallery ảnh/file */}
                  {files.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {files.map((f: any) => (
                        <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer"
                          className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 block hover:shadow-md transition-all">
                          {f.file_type?.startsWith("image/") ? (
                            <img src={f.file_url} alt={f.file_name} className="w-full h-28 object-cover" />
                          ) : (
                            <div className="w-full h-28 flex flex-col items-center justify-center gap-2 p-2">
                              <FileText className="w-8 h-8 text-rose-400" />
                              <p className="text-[10px] text-slate-500 font-bold truncate w-full text-center px-1">{f.file_name}</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-white" />
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Fallback: file cũ (trường file_url trực tiếp trên minh_chung) */}
                  {files.length === 0 && mc.file_url && (
                    <a href={mc.file_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Xem file đính kèm
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ghi chú sinh viên */}
      {data.ghi_chu_sv && (
        <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-800 mb-2">Ghi chú của sinh viên</h3>
          <p className="text-sm text-blue-700">{data.ghi_chu_sv}</p>
        </div>
      )}

      {/* Lịch sử duyệt */}
      {lichSu.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Shield className="w-5 h-5" /></div>
            <h2 className="text-lg font-semibold text-slate-800">Lịch sử xử lý</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {lichSu.map((ls: any) => (
              <div key={ls.id} className="px-6 py-4 flex items-start gap-3 text-sm">
                <div className="w-2 h-2 bg-indigo-400 rounded-full mt-2 shrink-0"></div>
                <div>
                  <p className="font-medium text-slate-700">{ls.ghi_chu}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {ls.users?.ho_ten || "Hệ thống"} • {new Date(ls.thoi_gian).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phản hồi đã có */}
      {data.phan_hoi_duyet && !canReview && (
        <div className={`rounded-2xl p-6 border ${data.trang_thai === "approved" ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100"}`}>
          <h3 className={`font-bold mb-2 ${data.trang_thai === "approved" ? "text-emerald-800" : "text-rose-800"}`}>
            Phản hồi của cán bộ
          </h3>
          <p className={`text-sm ${data.trang_thai === "approved" ? "text-emerald-700" : "text-rose-700"}`}>{data.phan_hoi_duyet}</p>
        </div>
      )}

      {/* Review Actions */}
      {canReview && (
        <div className="sticky bottom-6 bg-white rounded-2xl border border-slate-200 shadow-xl p-6 flex flex-col md:flex-row items-stretch md:items-center gap-4 z-20">
          <div className="flex-1 text-sm text-slate-500 font-medium">
            Hãy kiểm tra kỹ minh chứng trước khi đưa ra quyết định.
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowModal("rejected")}
              className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-200"
            >
              <XCircle className="w-5 h-5" /> Từ chối
            </button>
            <button
              onClick={() => setShowModal("approved")}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <CheckCircle2 className="w-5 h-5" /> Phê duyệt
            </button>
          </div>
        </div>
      )}

      {/* Modal phản hồi & Email */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {showModal === "approved" ? "Xác nhận Phê duyệt" : showModal === "rejected" ? "Xác nhận Từ chối" : "Gửi Email cho Sinh viên"}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {showModal === "approved"
                ? "Bạn có chắc chắn phê duyệt hồ sơ này không?"
                : showModal === "rejected" ? "Vui lòng nhập lý do từ chối hoặc yêu cầu bổ sung." : "Nhập tiêu đề và nội dung email thông báo đến sinh viên."}
            </p>
            
            {showModal === "email" && (
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Tiêu đề email..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-4"
              />
            )}

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder={showModal === "approved" ? "Nhận xét (không bắt buộc)..." : showModal === "email" ? "Nội dung email..." : "Lý do từ chối / Yêu cầu bổ sung..."}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none mb-6"
            />

            {resultMsg && <p className="text-sm text-indigo-600 font-medium mb-4">{resultMsg}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowModal(null); setFeedback(""); setEmailSubject(""); setResultMsg(""); }}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={showModal === "email" ? handleSendEmail : handleReview}
                disabled={reviewing || (showModal === "rejected" && !feedback.trim()) || (showModal === "email" && (!feedback.trim() || !emailSubject.trim()))}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  showModal === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                    : showModal === "email"
                    ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    : "bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200"
                }`}
              >
                {reviewing && <Loader2 className="w-4 h-4 animate-spin" />}
                {showModal === "approved" ? "Phê duyệt" : showModal === "email" ? "Gửi Email" : "Từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component
function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <span className="text-slate-400 font-medium block text-xs">{label}</span>
      <span className="font-semibold text-slate-700">{value || "—"}</span>
    </div>
  );
}
