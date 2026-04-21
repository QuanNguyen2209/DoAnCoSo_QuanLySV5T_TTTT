"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Send, FileText, CheckCircle2, Clock, XCircle,
  ChevronDown, ChevronRight, Upload, Trash2, X, Loader2,
  Image as ImageIcon, FileUp, Save, Download
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import axios from "axios";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [hoSo, setHoSo] = useState<any>(null);
  const [criteriaTree, setCriteriaTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  // Text descriptions per child criteria: { [tieu_chi_id]: string }
  const [descriptions, setDescriptions] = useState<Record<number, string>>({});
  const [savingDesc, setSavingDesc] = useState<Record<number, boolean>>({});
  const [savedDesc, setSavedDesc] = useState<Record<number, boolean>>({});

  // File upload per child criteria
  const [uploadingFile, setUploadingFile] = useState<Record<string, boolean>>({});

  // Submit state
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const hsRes = await api.get(`/ho-so/${params.id}`);
      if (hsRes.data.success) {
        const hsData = hsRes.data.data;
        setHoSo(hsData);

        // Populate descriptions from existing minh_chung
        const descMap: Record<number, string> = {};
        (hsData.minh_chung || []).forEach((mc: any) => {
          if (mc.mo_ta) descMap[mc.tieu_chi_id] = mc.mo_ta;
        });
        setDescriptions(descMap);

        // Fetch criteria tree
        const tcRes = await api.get("/tieu-chi", { params: { loai_doi_tuong: hsData.loai_doi_tuong } });
        if (tcRes.data.success) {
          setCriteriaTree(tcRes.data.data || []);
          const exp: Record<number, boolean> = {};
          (tcRes.data.data || []).forEach((p: any) => (exp[p.id] = true));
          setExpanded(exp);
        }
      }
    } catch {
      alert("Không thể tải thông tin hồ sơ");
      router.push("/student/records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchData();
  }, [params.id]);

  const toggleExpand = (id: number) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // Lưu mô tả cho 1 tiêu chí con
  const handleSaveDescription = async (tieuChiId: number) => {
    if (!hoSo) return;
    setSavingDesc((p) => ({ ...p, [tieuChiId]: true }));
    try {
      await api.post("/minh-chung/upsert-criteria", {
        ho_so_id: hoSo.id,
        tieu_chi_id: tieuChiId,
        mo_ta: descriptions[tieuChiId] || "",
      });
      setSavedDesc((p) => ({ ...p, [tieuChiId]: true }));
      setTimeout(() => setSavedDesc((p) => ({ ...p, [tieuChiId]: false })), 2000);
      await fetchData();
    } catch {
      alert("Lỗi khi lưu mô tả");
    } finally {
      setSavingDesc((p) => ({ ...p, [tieuChiId]: false }));
    }
  };

  // Upload file cho 1 tiêu chí con
  const handleFileUpload = async (tieuChiId: number, file: File) => {
    if (!hoSo) return;
    if (file.size > 5 * 1024 * 1024) return alert("File không được vượt quá 5MB");

    const key = `${tieuChiId}-${Date.now()}`;
    setUploadingFile((p) => ({ ...p, [key]: true }));

    try {
      // 1. Đảm bảo đã có minh chứng cho tiêu chí này
      const upsertRes = await api.post("/minh-chung/upsert-criteria", {
        ho_so_id: hoSo.id,
        tieu_chi_id: tieuChiId,
        mo_ta: descriptions[tieuChiId] || "",
      });
      const minhChungId = upsertRes.data.data.id;

      // 2. Lấy signed URL
      const urlRes = await api.post("/minh-chung/upload-url", {
        file_name: file.name,
        file_type: file.type,
        ho_so_id: hoSo.id,
      });
      const { uploadUrl, publicUrl } = urlRes.data.data;

      // 3. Upload file
      await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } });

      // 4. Lưu file vào bảng minh_chung_files
      await api.post(`/minh-chung/${minhChungId}/files`, {
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      });

      await fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Lỗi khi tải file";
      alert(msg);
    } finally {
      setUploadingFile((p) => {
        const n = { ...p };
        delete n[key];
        return n;
      });
    }
  };

  // Xóa 1 file
  const handleDeleteFile = async (fileId: number) => {
    if (!confirm("Xóa file này?")) return;
    try {
      await api.delete(`/minh-chung/files/${fileId}`);
      await fetchData();
    } catch {
      alert("Lỗi khi xóa file");
    }
  };

  // Nộp hồ sơ
  const handleSubmitApp = async () => {
    if (!hoSo || hoSo.trang_thai !== "draft") return;
    if (!hoSo.minh_chung || hoSo.minh_chung.length === 0) {
      return alert("Vui lòng thêm minh chứng cho ít nhất 1 tiêu chí trước khi nộp!");
    }
    if (!confirm("Bạn có chắc chắn muốn nộp hồ sơ? Sau khi nộp bạn không thể chỉnh sửa.")) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/ho-so/${params.id}/submit`, { sinh_vien_id: hoSo.sinh_vien_id });
      if (res.data.success) {
        alert("Nộp hồ sơ thành công!");
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Lỗi khi nộp hồ sơ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  if (!hoSo) return <div className="text-center p-12">Không tìm thấy hồ sơ</div>;

  const isEditable = hoSo.trang_thai === "draft" || hoSo.trang_thai === "rejected";

  // Helper: get minh chung + files for a tieu_chi_id
  const getMinhChung = (tieuChiId: number) => {
    return (hoSo.minh_chung || []).find((m: any) => m.tieu_chi_id === tieuChiId);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 md:p-8 pb-24">
      {/* Nút quay lại */}
      <Link
        href="/student/records"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>

      {/* Header Hồ Sơ */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-sm border border-indigo-100">
              {hoSo.ma_ho_so}
            </span>
            <span
              className={`px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5 ${
                hoSo.trang_thai === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : hoSo.trang_thai === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : hoSo.trang_thai === "rejected"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {hoSo.trang_thai === "approved" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : hoSo.trang_thai === "pending" ? (
                <Clock className="w-4 h-4" />
              ) : hoSo.trang_thai === "rejected" ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {hoSo.trang_thai === "approved"
                ? "Đã duyệt"
                : hoSo.trang_thai === "pending"
                ? "Đang chờ duyệt"
                : hoSo.trang_thai === "rejected"
                ? "Cần bổ sung"
                : "Bản nháp"}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hồ sơ {hoSo.loai_doi_tuong === "sv5t" || hoSo.loai_doi_tuong === "individual" ? "Sinh viên 5 Tốt" : "Tập thể Tiên tiến"}
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Kỳ: {hoSo.ky_xet_duyet?.ten_ky} ({hoSo.ky_xet_duyet?.nam_hoc})
          </p>
        </div>

        {isEditable && (
          <button
            onClick={handleSubmitApp}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 w-full md:w-auto justify-center disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Nộp hồ sơ
          </button>
        )}
      </div>

      {/* Phản hồi từ cán bộ */}
      {hoSo.phan_hoi_duyet && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <h3 className="font-bold text-rose-800 mb-1">Phản hồi từ cán bộ:</h3>
          <p className="text-sm text-rose-700">{hoSo.phan_hoi_duyet}</p>
        </div>
      )}

      {/* Hướng dẫn */}
      {isEditable && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-blue-800/80 leading-relaxed">
            Hãy mô tả thành tích của bạn cho từng tiêu chí và tải lên 3-4 ảnh/file minh chứng tương ứng. Sau khi hoàn tất, nhấn <strong>"Nộp hồ sơ"</strong> để gửi cho cán bộ xét duyệt.
          </p>
        </div>
      )}

      {/* Danh sách tiêu chí */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 ml-2">Chi tiết minh chứng theo tiêu chuẩn</h2>

        {criteriaTree.map((parent) => {
          const isExpanded = expanded[parent.id] ?? true;
          return (
            <div key={parent.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              {/* Header tiêu chí cha */}
              <div
                className="flex items-center justify-between p-5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleExpand(parent.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-black flex items-center justify-center shrink-0">
                    {parent.thu_tu}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{parent.ten_tieu_chi}</h3>
                    <p className="text-xs text-slate-500 font-medium">{parent.children?.length || 0} tiêu chí con</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
              </div>

              {/* Tiêu chí con */}
              <AnimatePresence>
                {isExpanded && parent.children && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-100 overflow-hidden">
                    {parent.children.map((child: any, cIdx: number) => {
                      const mc = getMinhChung(child.id);
                      const files = mc?.minh_chung_files || [];
                      const fileCount = files.length;
                      const canUploadMore = fileCount < 4;

                      return (
                        <div key={child.id} className={`p-5 ${cIdx < parent.children.length - 1 ? "border-b border-slate-50" : ""}`}>
                          {/* Tên tiêu chí con */}
                          <div className="mb-3">
                            <p className="font-bold text-slate-800 text-sm">
                              <span className="text-indigo-600 mr-1">
                                {parent.thu_tu}.{child.thu_tu}
                              </span>{" "}
                              {child.ten_tieu_chi}
                            </p>
                            {child.mo_ta && <p className="text-xs text-slate-500 mt-1">{child.mo_ta}</p>}
                          </div>

                          {/* TEXTBOX mô tả inline */}
                          <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Mô tả thành tích / Tự liệt kê</label>
                            <textarea
                              value={descriptions[child.id] || ""}
                              onChange={(e) => setDescriptions((prev) => ({ ...prev, [child.id]: e.target.value }))}
                              disabled={!isEditable}
                              rows={3}
                              placeholder="VD: Em đã đạt GPA 3.5/4.0, đứng top 10% khoa CNTT. Tham gia 3 dự án NCKH cấp khoa..."
                              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none bg-slate-50 focus:bg-white transition-all disabled:bg-slate-100 disabled:text-slate-500"
                            />
                            {isEditable && (
                              <div className="flex items-center justify-end gap-2 mt-2">
                                {savedDesc[child.id] && (
                                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã lưu
                                  </span>
                                )}
                                <button
                                  onClick={() => handleSaveDescription(child.id)}
                                  disabled={savingDesc[child.id]}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                >
                                  {savingDesc[child.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                  Lưu mô tả
                                </button>
                              </div>
                            )}
                          </div>

                          {/* MULTI-FILE upload area */}
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">
                              File minh chứng ({fileCount}/4)
                            </label>

                            {/* Hiển thị files đã upload */}
                            {fileCount > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                {files.map((f: any) => (
                                  <div key={f.id} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                                    {f.file_type?.startsWith("image/") ? (
                                      <img src={f.file_url} alt={f.file_name} className="w-full h-28 object-cover" />
                                    ) : (
                                      <div className="w-full h-28 flex flex-col items-center justify-center gap-2 p-2">
                                        <FileText className="w-8 h-8 text-rose-400" />
                                        <p className="text-[10px] text-slate-500 font-bold truncate w-full text-center px-1">{f.file_name}</p>
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <a
                                        href={f.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-white rounded-lg text-slate-700 hover:text-indigo-600"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Download className="w-4 h-4" />
                                      </a>
                                      {isEditable && (
                                        <button
                                          onClick={() => handleDeleteFile(f.id)}
                                          className="p-2 bg-white rounded-lg text-slate-700 hover:text-rose-600"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Nút upload thêm */}
                            {isEditable && canUploadMore && (
                              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 hover:border-indigo-300 transition-all relative">
                                <input
                                  type="file"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  accept="image/*,.pdf,.doc,.docx"
                                  multiple
                                  onChange={(e) => {
                                    const fileList = e.target.files;
                                    if (!fileList) return;
                                    const remaining = 4 - fileCount;
                                    const filesToUpload = Array.from(fileList).slice(0, remaining);
                                    filesToUpload.forEach((file) => handleFileUpload(child.id, file));
                                    e.target.value = "";
                                  }}
                                />
                                {Object.keys(uploadingFile).length > 0 ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                    <p className="text-xs font-bold text-indigo-600">Đang tải lên...</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                                      <Upload className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-600">
                                      Bấm hoặc kéo thả file (Ảnh, PDF - tối đa {4 - fileCount} file nữa)
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {!isEditable && fileCount === 0 && (
                              <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 text-center">
                                <p className="text-sm text-slate-400 font-medium">Chưa có file minh chứng</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
