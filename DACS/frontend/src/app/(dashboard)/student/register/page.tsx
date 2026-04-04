"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  User, 
  Users, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  FileText, 
  Check, 
  Save,
  Info,
  Loader2
} from "lucide-react";
import { studentService, Criterion, Period, Application } from "@/services/studentService";

export default function RegisterReviewPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<'individual' | 'collective' | null>(null);
  
  // Data from API
  const [periods, setPeriods] = useState<Period[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  
  // Form State
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | "">("");
  const [currentApp, setCurrentApp] = useState<Application | null>(null);
  
  // Proof Form State
  const [proofForm, setProofForm] = useState({
    tieu_chi_id: "",
    ten_thanh_tich: "",
    mo_ta: "",
    cap_thanh_tich: "truong" as const,
    ngay_ghi_nhan: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activePeriods, allCriteria] = await Promise.all([
          studentService.getActivePeriods(),
          studentService.getCriteria()
        ]);
        setPeriods(activePeriods);
        setCriteria(allCriteria);
        if (activePeriods.length > 0) {
          setSelectedPeriodId(activePeriods[0].id);
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartApplication = async () => {
    if (!target || !selectedPeriodId) return;
    setLoading(true);
    try {
      const app = await studentService.createDraft({
        sinh_vien_id: 1, // Mock user ID
        ky_xet_duyet_id: Number(selectedPeriodId),
        loai_doi_tuong: target,
      });
      setCurrentApp(app);
      setStep(2);
    } catch (error) {
      alert("Không thể khởi tạo hồ sơ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProof = async () => {
    if (!currentApp || !proofForm.tieu_chi_id || !proofForm.ten_thanh_tich || !proofForm.ngay_ghi_nhan) {
      alert("Vui lòng điền đầy đủ thông tin minh chứng.");
      return;
    }

    setSubmitting(true);
    try {
      let file_url = "";
      let file_name = "";

      if (file) {
        const uploadData = await studentService.getUploadUrl(currentApp.id, file.name, file.type);
        // In a real app, logic to actually PUT the file to uploadData.uploadUrl goes here
        // For now, we simulate the upload by setting the URL
        file_url = uploadData.publicUrl;
        file_name = file.name;
      }

      await studentService.addProof({
        ho_so_id: currentApp.id,
        tieu_chi_id: Number(proofForm.tieu_chi_id),
        ten_thanh_tich: proofForm.ten_thanh_tich,
        mo_ta: proofForm.mo_ta,
        cap_thanh_tich: proofForm.cap_thanh_tich,
        ngay_ghi_nhan: proofForm.ngay_ghi_nhan,
        file_url,
        file_name,
      });

      alert("Đã thêm minh chứng thành công!");
      // Reset proof form
      setProofForm({
        tieu_chi_id: "",
        ten_thanh_tich: "",
        mo_ta: "",
        cap_thanh_tich: "truong",
        ngay_ghi_nhan: "",
      });
      setFile(null);
    } catch (error) {
      alert("Lỗi khi thêm minh chứng.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!currentApp) return;
    setSubmitting(true);
    try {
      await studentService.submitApplication(currentApp.id, 1);
      setStep(3);
    } catch (error: any) {
      alert(error.response?.data?.error || "Lỗi khi nộp hồ sơ.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: "Đối tượng" },
    { id: 2, name: "Thông tin & Minh chứng" },
    { id: 3, name: "Hoàn tất" }
  ];

  if (loading && step === 1) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-600" />
        <p className="font-medium">Đang tải dữ liệu hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Stepper */}
      <div className="mb-12">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
          <motion.div 
            className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0"
            initial={{ width: "0%" }}
            animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          ></motion.div>
          
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= s.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border-2 border-slate-200 text-slate-400"
              }`}>
                {step > s.id ? <Check className="w-5 h-5" /> : s.id}
              </div>
              <span className={`text-xs mt-3 font-bold uppercase tracking-wider ${step >= s.id ? "text-indigo-600" : "text-slate-400"}`}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 p-10"
      >
        {step === 1 && (
          <div className="space-y-10">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Bạn muốn đăng ký danh hiệu nào?</h2>
              <p className="text-slate-500 font-medium">Chọn kỳ xét duyệt và đối tượng phù hợp</p>
            </div>

            <div className="max-w-md mx-auto mb-8 text-left">
              <label className="block text-sm font-bold text-slate-700 mb-2">Kỳ xét duyệt đang mở</label>
              <select 
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
                className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 bg-slate-50/50 appearance-none"
              >
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{p.ten_ky} ({p.nam_hoc})</option>
                ))}
                {periods.length === 0 && <option value="">Không có kỳ nào đang mở</option>}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div 
                onClick={() => setTarget('individual')}
                className={`group cursor-pointer p-8 rounded-[32px] border-2 transition-all h-full flex flex-col items-center text-center ${
                  target === 'individual' ? "border-indigo-500 bg-indigo-50/30" : "border-slate-50 hover:border-indigo-200 hover:bg-slate-50/50"
                }`}
              >
                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                  target === 'individual' ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-white border border-slate-200 text-slate-400"
                }`}>
                  <User className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sinh viên 5 Tốt</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Dành cho cá nhân sinh viên có thành tích xuất sắc trong học tập và rèn luyện.</p>
              </div>

              <div 
                onClick={() => setTarget('collective')}
                className={`group cursor-pointer p-8 rounded-[32px] border-2 transition-all h-full flex flex-col items-center text-center ${
                  target === 'collective' ? "border-blue-500 bg-blue-50/30" : "border-slate-50 hover:border-blue-200 hover:bg-slate-50/50"
                }`}
              >
                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                  target === 'collective' ? "bg-blue-600 text-white shadow-xl shadow-blue-100" : "bg-white border border-slate-200 text-slate-400"
                }`}>
                  <Users className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Tập thể Tiên tiến</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Dành cho các Chi Đoàn, Chi Hội, CLB và Đội nhóm có hoạt động phong trào nổi bật.</p>
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button 
                onClick={handleStartApplication}
                disabled={!target || !selectedPeriodId || loading}
                className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-bold transition-all ${
                  target && selectedPeriodId ? "bg-slate-900 text-white hover:bg-black shadow-xl" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Bắt đầu tạo hồ sơ"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Chi tiết minh chứng</h2>
                <p className="text-slate-500 text-sm font-medium">Hồ sơ: <span className="text-indigo-600 font-bold">{currentApp?.ma_ho_so}</span></p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 text-left">Tên thành tích / Hoạt động</label>
                <input 
                  type="text" 
                  value={proofForm.ten_thanh_tich}
                  onChange={(e) => setProofForm({...proofForm, ten_thanh_tich: e.target.value})}
                  placeholder="Ví dụ: Đạt giải Nhất cuộc thi Olympic Tin học 2025"
                  className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 bg-slate-50/50" 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 text-left">Thời gian ghi nhận</label>
                  <input 
                    type="date"
                    value={proofForm.ngay_ghi_nhan}
                    onChange={(e) => setProofForm({...proofForm, ngay_ghi_nhan: e.target.value})}
                    className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900 bg-slate-50/50" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 text-left">Tiêu chí tương ứng</label>
                  <select 
                    value={proofForm.tieu_chi_id}
                    onChange={(e) => setProofForm({...proofForm, tieu_chi_id: e.target.value})}
                    className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 bg-slate-50/50 appearance-none"
                  >
                    <option value="">-- Chọn tiêu chí --</option>
                    {criteria
                      .filter(c => c.loai_doi_tuong === target || c.loai_doi_tuong === 'both')
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.ten_tieu_chi}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 text-left">Cấp thành tích</label>
                <select 
                  value={proofForm.cap_thanh_tich}
                  onChange={(e) => setProofForm({...proofForm, cap_thanh_tich: e.target.value as any})}
                  className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-900 bg-slate-50/50 appearance-none"
                >
                  <option value="truong">Cấp Trường</option>
                  <option value="khoa">Cấp Khoa</option>
                  <option value="khac">Cấp khác / Ngoài trường</option>
                </select>
              </div>

              {/* Upload UI */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 text-left">Tải lên minh chứng (PDF, JPG, PNG)</label>
                <div 
                  className={`border-3 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                    file ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200 bg-slate-50/30 hover:bg-slate-50 hover:border-indigo-300"
                  }`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div className={`w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-4 transition-all ${
                    file ? "text-emerald-600" : "text-slate-400 group-hover:text-indigo-600 group-hover:scale-110"
                  }`}>
                    {file ? <Check className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                  </div>
                  <p className="text-slate-900 font-bold mb-1">
                    {file ? file.name : "Click để tải lên hoặc kéo thả vào đây"}
                  </p>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Dung lượng tối đa 10MB mỗi file"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-10">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-slate-500 hover:text-slate-900 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Quay lại
              </button>
              <div className="flex gap-4">
                <button 
                  onClick={handleAddProof}
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Thêm & Lưu minh chứng
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex items-center gap-3 px-10 py-4 rounded-2xl font-bold bg-[#546fff] text-white hover:opacity-90 shadow-xl shadow-indigo-100 transition-all"
                >
                  Tiếp tục
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-emerald-200/50">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Xác nhận nộp hồ sơ</h2>
            <p className="text-slate-500 font-medium mb-12 max-w-md mx-auto leading-relaxed">
              Bạn đang nộp hồ sơ mã <span className="font-bold text-indigo-600">{currentApp?.ma_ho_so}</span>. Sau khi nộp, bạn sẽ không thể chỉnh sửa cho đến khi có phản hồi.
            </p>
            
            <div className="bg-slate-50 rounded-3xl p-8 mb-12 inline-block text-left border border-slate-100 min-w-[320px]">
               <div className="flex items-center gap-3 text-indigo-600 mb-4 font-bold">
                 <Info className="w-5 h-5" />
                 <span>Tóm tắt hồ sơ:</span>
               </div>
               <p className="text-slate-900 font-bold text-lg mb-1">
                 {target === 'individual' ? "Sinh viên 5 Tốt" : "Tập thể Tiên tiến"}
               </p>
               <p className="text-slate-500 font-bold text-sm tracking-wide">
                 {periods.find(p => p.id === selectedPeriodId)?.ten_ky}
               </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={() => setStep(2)}
                disabled={submitting}
                className="px-10 py-5 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all"
              >
                Quay lại sửa
              </button>
              <button 
                onClick={handleSubmitApplication}
                disabled={submitting}
                className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                Nộp hồ sơ ngay
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
