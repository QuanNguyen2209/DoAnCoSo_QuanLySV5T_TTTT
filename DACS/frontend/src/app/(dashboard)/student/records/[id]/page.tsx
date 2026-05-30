"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Send, FileText, CheckCircle2, Clock, XCircle,
  Upload, Trash2, X, Loader2, Download, AlertCircle, Save, FileDown
} from "lucide-react";
import { useState, useEffect } from "react";
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

  // Mới: State cho Layout Sidebar
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  // Text descriptions per child criteria: { [tieu_chi_id]: string }
  const [descriptions, setDescriptions] = useState<Record<number, string>>({});
  const [savingDesc, setSavingDesc] = useState<Record<number, boolean>>({});
  const [savedDesc, setSavedDesc] = useState<Record<number, boolean>>({});

  // File upload per child criteria
  const [uploadingFile, setUploadingFile] = useState<Record<string, boolean>>({});

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // PDF export state
  const [exportingPDF, setExportingPDF] = useState(false);
  const [missingItems, setMissingItems] = useState<any[]>([]);

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
          const tree = tcRes.data.data || [];
          setCriteriaTree(tree);
          
          // Mặc định chọn tiêu chí con đầu tiên
          if (tree.length > 0 && tree[0].children?.length > 0) {
            setSelectedChildId(tree[0].children[0].id);
          }
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

  // Helper: get minh chung + files for a tieu_chi_id
  const getMinhChung = (tieuChiId: number) => {
    return (hoSo?.minh_chung || []).find((m: any) => m.tieu_chi_id === tieuChiId);
  };

  // Nộp hồ sơ & Validation
  const handleSubmitApp = async () => {
    if (!hoSo || hoSo.trang_thai !== "draft") return;
    
    // Kiểm tra tiêu chí bắt buộc
    const missing: any[] = [];
    criteriaTree.forEach(parent => {
      parent.children?.forEach((child: any) => {
        if (child.bat_buoc) {
          const desc = descriptions[child.id] || "";
          const mc = getMinhChung(child.id);
          const fileCount = mc?.minh_chung_files?.length || 0;
          
          const missingDesc = !desc.trim();
          const missingFile = fileCount === 0;

          if (missingDesc || missingFile) {
            missing.push({
              parentName: parent.ten_tieu_chi,
              childName: child.ten_tieu_chi,
              missingDesc,
              missingFile
            });
          }
        }
      });
    });

    if (missing.length > 0) {
      setMissingItems(missing);
      setShowValidationModal(true);
      return;
    }

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

  // Xuất PDF
  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const res = await api.get(`/pdf/ho-so/${params.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BanGioiThieu_${hoSo.ma_ho_so || 'HoSo'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Lỗi khi xuất PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  // Gom nhóm các lỗi thiếu theo tiêu chí cha
  const groupByParent = (items: any[]) => {
    return items.reduce((acc, curr) => {
      if (!acc[curr.parentName]) acc[curr.parentName] = [];
      acc[curr.parentName].push(curr);
      return acc;
    }, {} as Record<string, any[]>);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  if (!hoSo) return <div className="text-center p-12">Không tìm thấy hồ sơ</div>;

  const isEditable = hoSo.trang_thai === "draft" || hoSo.trang_thai === "rejected";

  // Tìm tiêu chí con đang được chọn
  let activeChild: any = null;
  let activeParent: any = null;
  if (selectedChildId) {
    for (const p of criteriaTree) {
      const found = p.children?.find((c: any) => c.id === selectedChildId);
      if (found) {
        activeChild = found;
        activeParent = p;
        break;
      }
    }
  }

  const activeMc = activeChild ? getMinhChung(activeChild.id) : null;
  const activeFiles = activeMc?.minh_chung_files || [];
  const activeFileCount = activeFiles.length;
  const canUploadMore = activeFileCount < 4;

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-8 pb-24">
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
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Hồ sơ {hoSo.loai_doi_tuong === "sv5t" || hoSo.loai_doi_tuong === "individual" ? "Sinh viên 5 Tốt" : "Tập thể Tiên tiến"}
            {hoSo.cap_xet_duyet && (
              <span className={`text-sm font-bold px-3 py-1.5 rounded-xl border ${
                hoSo.cap_xet_duyet === "truong" 
                  ? "bg-rose-50 text-rose-600 border-rose-200" 
                  : "bg-indigo-50 text-indigo-600 border-indigo-200"
              }`}>
                Cấp {hoSo.cap_xet_duyet === "truong" ? "Trường" : "Khoa"}
              </span>
            )}
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Kỳ: {hoSo.ky_xet_duyet?.ten_ky} ({hoSo.ky_xet_duyet?.nam_hoc})
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Nút Xuất PDF */}
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 justify-center disabled:opacity-50"
          >
            {exportingPDF ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />} Xuất PDF
          </button>

          {isEditable && (
            <button
              onClick={handleSubmitApp}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 justify-center disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Nộp hồ sơ ngay
            </button>
          )}
        </div>
      </div>

      {/* Phản hồi từ cán bộ */}
      {hoSo.phan_hoi_duyet && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
          <h3 className="font-bold text-rose-800 mb-1">Phản hồi từ cán bộ:</h3>
          <p className="text-sm text-rose-700">{hoSo.phan_hoi_duyet}</p>
        </div>
      )}

      {/* Layout Sidebar + Main */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* SIDEBAR */}
        <div className="w-full lg:w-[32%] shrink-0 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col max-h-[800px] lg:sticky lg:top-24">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h2 className="font-black text-slate-800 uppercase tracking-wide">Danh mục tiêu chí</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-5 custom-scrollbar">
            {criteriaTree.map(parent => (
              <div key={parent.id}>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                  {parent.ten_tieu_chi}
                </h3>
                <div className="space-y-1">
                  {parent.children?.map((child: any, idx: number) => {
                    const isSelected = selectedChildId === child.id;
                    const mc = getMinhChung(child.id);
                    const fileCount = mc?.minh_chung_files?.length || 0;
                    
                    return (
                      <button
                        key={child.id}
                        onClick={() => setSelectedChildId(child.id)}
                        className={`w-full text-left px-3 py-3 rounded-xl transition-all flex items-start gap-3 border-l-[3px] ${
                          isSelected 
                            ? "bg-indigo-50/80 border-indigo-600 shadow-sm" 
                            : "bg-transparent border-transparent hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                          isSelected ? "bg-indigo-200 text-indigo-800" : "bg-slate-200 text-slate-600"
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className={`text-sm font-bold leading-snug ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                            {child.ten_tieu_chi} 
                            {fileCount > 0 && <span className="text-slate-500 font-medium ml-1.5">({fileCount})</span>}
                            {child.bat_buoc && <span className="text-rose-500 font-bold ml-1" title="Bắt buộc">(*)</span>}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="w-full lg:w-[68%] bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm min-h-[500px]">
          {!activeChild ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 py-24">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-5">
                <FileText className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Chọn một tiêu chí bên trái để bắt đầu</h3>
              <p className="text-slate-500 font-medium max-w-md">Bạn có thể xem chi tiết yêu cầu, nhập nội dung mô tả và tải lên các file minh chứng tương ứng ở khu vực này.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="border-b border-slate-100 pb-5">
                <h2 className="text-2xl font-bold text-slate-900 mb-3 leading-snug">
                  {activeParent?.thu_tu}.{activeChild.thu_tu} {activeChild.ten_tieu_chi}
                </h2>
                {activeChild.mo_ta && <p className="text-slate-600 leading-relaxed">{activeChild.mo_ta}</p>}
                {activeChild.bat_buoc && (
                  <div className="inline-flex mt-4 px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-100 items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Đây là tiêu chí bắt buộc
                  </div>
                )}
              </div>

              {/* TEXTBOX */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Mô tả minh chứng {activeChild.bat_buoc && <span className="text-rose-500">*</span>}</label>
                <textarea
                  value={descriptions[activeChild.id] || ""}
                  onChange={(e) => setDescriptions((prev) => ({ ...prev, [activeChild.id]: e.target.value }))}
                  disabled={!isEditable}
                  rows={4}
                  placeholder={`Nhập mô tả chi tiết cho tiêu chí "${activeChild.ten_tieu_chi}"...`}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none bg-slate-50 focus:bg-white transition-all disabled:bg-slate-100 disabled:text-slate-500"
                />
                {isEditable && (
                  <div className="flex items-center justify-end gap-3 mt-3">
                    {savedDesc[activeChild.id] && (
                      <span className="text-sm text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Đã lưu tự động
                      </span>
                    )}
                    <button
                      onClick={() => handleSaveDescription(activeChild.id)}
                      disabled={savingDesc[activeChild.id]}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      {savingDesc[activeChild.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Lưu mô tả
                    </button>
                  </div>
                )}
              </div>

              {/* UPLOAD */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">Minh chứng File/Ảnh ({activeFileCount}/4) {activeChild.bat_buoc && <span className="text-rose-500">*</span>}</label>
                
                {/* Hiển thị files đã upload */}
                {activeFileCount > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {activeFiles.map((f: any) => (
                      <div key={f.id} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm hover:shadow-md transition-all">
                        {f.file_type?.startsWith("image/") ? (
                          <img src={f.file_url} alt={f.file_name} className="w-full h-32 object-cover" />
                        ) : (
                          <div className="w-full h-32 flex flex-col items-center justify-center gap-2 p-3">
                            <FileText className="w-10 h-10 text-rose-400" />
                            <p className="text-xs text-slate-600 font-bold truncate w-full text-center">{f.file_name}</p>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <a
                            href={f.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-white rounded-xl text-slate-800 hover:text-indigo-600 hover:scale-110 transition-transform"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          {isEditable && (
                            <button
                              onClick={() => handleDeleteFile(f.id)}
                              className="p-2.5 bg-white rounded-xl text-slate-800 hover:text-rose-600 hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload box */}
                {isEditable && canUploadMore && (
                  <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-8 text-center hover:bg-indigo-50 hover:border-indigo-400 transition-all relative group cursor-pointer">
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept="image/*,.pdf,.doc,.docx"
                      multiple
                      onChange={(e) => {
                        const fileList = e.target.files;
                        if (!fileList) return;
                        const remaining = 4 - activeFileCount;
                        const filesToUpload = Array.from(fileList).slice(0, remaining);
                        filesToUpload.forEach((file) => handleFileUpload(activeChild.id, file));
                        e.target.value = "";
                      }}
                    />
                    {Object.keys(uploadingFile).length > 0 ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-sm font-bold text-indigo-600">Đang tải lên hệ thống...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-white shadow-sm text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-indigo-900 mb-1">
                            Kéo thả file tại đây hoặc nhấp để chọn file
                          </p>
                          <p className="text-xs font-medium text-slate-500">
                            Hỗ trợ: PDF, DOC, DOCX, JPG, PNG (tối đa 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isEditable && activeFileCount === 0 && (
                  <div className="p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-center">
                    <p className="text-sm text-slate-400 font-medium">Bạn chưa tải lên file minh chứng nào cho tiêu chí này.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Missing Criteria Validation */}
      <AnimatePresence>
        {showValidationModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
              
              <div className="p-8 text-center border-b border-slate-100">
                <div className="w-20 h-20 bg-rose-50 border-4 border-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <X className="w-8 h-8 text-rose-500" strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-black text-slate-800">Thiếu thông tin bắt buộc</h2>
                <p className="text-slate-500 font-medium mt-2">Vui lòng hoàn thành các trường sau trước khi nộp hồ sơ:</p>
              </div>
              
              <div className="bg-slate-50 p-6 max-h-[400px] overflow-y-auto">
                <table className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                  <thead className="bg-slate-100 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-xs uppercase tracking-widest font-black text-slate-500 w-1/3">Tiêu chuẩn lớn</th>
                      <th className="p-4 text-xs uppercase tracking-widest font-black text-slate-500">Chi tiết thiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(groupByParent(missingItems)).map(([parent, items]: any) => (
                      <tr key={parent}>
                        <td className="p-4 text-sm font-bold text-slate-800 align-top bg-slate-50/50">{parent}</td>
                        <td className="p-4">
                          <div className="space-y-4">
                            {items.map((item: any, i: number) => (
                              <div key={i} className="text-sm text-slate-700">
                                <p className="font-bold text-slate-900 mb-1">{item.childName}</p>
                                <ul className="list-disc ml-5 space-y-1">
                                  {item.missingDesc && <li>Mô tả minh chứng: <span className="text-rose-600 font-bold ml-1">là bắt buộc</span></li>}
                                  {item.missingFile && <li>Minh chứng file: <span className="text-rose-600 font-bold ml-1">là bắt buộc</span></li>}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 flex justify-center bg-white border-t border-slate-100">
                <button 
                  onClick={() => setShowValidationModal(false)} 
                  className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                >
                  Đã hiểu, Quay lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
