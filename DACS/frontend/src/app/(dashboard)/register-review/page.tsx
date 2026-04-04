"use client";

import { motion } from "framer-motion";
import { 
  Award, Users, Upload, Send, FileText, 
  ChevronRight, Info, CheckCircle2 
} from "lucide-react";
import { useState } from "react";

export default function RegisterReviewPage() {
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<"individual" | "collective" | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Đăng ký xét duyệt</h1>
          <p className="text-slate-500 font-medium mt-1">Khởi tạo hồ sơ danh hiệu cho năm học 2024 - 2025</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= s ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-200 text-slate-500"
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-indigo-600" : "bg-slate-200"}`}></div>}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Individual Selection */}
          <button 
            onClick={() => { setTarget("individual"); setStep(2); }}
            className={`p-8 rounded-3xl border-2 text-left transition-all group ${
              target === "individual" ? "border-indigo-500 bg-indigo-50/30" : "border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Sinh viên 5 Tốt</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
              Dành cho cá nhân sinh viên đăng ký xét duyệt các tiêu chí rèn luyện và học thuật.
            </p>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              Bắt đầu hồ sơ cá nhân <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {/* Collective Selection */}
          <button 
            onClick={() => { setTarget("collective"); setStep(2); }}
            className={`p-8 rounded-3xl border-2 text-left transition-all group ${
              target === "collective" ? "border-blue-500 bg-blue-50/30" : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Tập thể Tiên tiến</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">
              Dành cho Ban cán sự lớp, đại diện chi đoàn đăng ký xét duyệt danh hiệu cho đơn vị.
            </p>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              Bắt đầu hồ sơ tập thể <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8"
        >
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Thông tin & Minh chứng</h2>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Khai báo thành tích cho {target === "individual" ? "Cá nhân" : "Tập thể"}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Achievement Inputs */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Tên thành tích / Hoạt động</label>
              <input 
                type="text" 
                placeholder="VD: Giải Nhất NCKH cấp Trường 2023"
                className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900" 
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Thời gian ghi nhận</label>
                <input 
                  type="date"
                  className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Tiêu chí tương ứng</label>
                <select className="w-full px-5 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-900">
                  <option>Đạo đức tốt</option>
                  <option>Học tập tốt</option>
                  <option>Thể lực tốt</option>
                  <option>Tình nguyện tốt</option>
                  <option>Hội nhập tốt</option>
                </select>
              </div>
            </div>

            {/* Render additional fields if collective */}
            {target === "collective" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Cấp xét duyệt</label>
                <select className="w-full px-5 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-blue-900 bg-blue-50/30">
                  <option>Cấp Khoa</option>
                  <option>Cấp Trường</option>
                </select>
                <p className="text-xs font-semibold text-slate-400 mt-2">Dành riêng cho hồ sơ Tập thể Tiên tiến.</p>
              </div>
            )}

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Tải lên minh chứng (PDF, JPG, PNG)</label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer group">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-indigo-500 shadow-sm mb-4 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">Kéo thả hoặc bấm để chọn tệp</p>
                <p className="text-xs text-slate-400 font-medium">Bản scan quyết định, giấy khen hoặc hình ảnh hoạt động (Max 10MB)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button 
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Quay lại
            </button>
            <button 
              onClick={() => setStep(3)}
              className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Tiếp tục
            </button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-12 border border-slate-100 text-center shadow-sm"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Mọi thứ đã sẵn sàng!</h2>
          <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto leading-relaxed">
            Hồ sơ của bạn đã được lưu dưới dạng <span className="text-slate-900 font-bold underline">Bản nháp</span>. Bạn có muốn nộp ngay để bắt đầu quá trình xét duyệt không?
          </p>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.href = "/profile-records"}
              className="w-full px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Nộp hồ sơ ngay
            </button>
            <button 
              onClick={() => window.location.href = "/profile-records"}
              className="w-full px-6 py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
            >
              Lưu bản nháp và xem lại sau
            </button>
          </div>
        </motion.div>
      )}

      {/* Info Tips */}
      {step < 3 && (
        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-start gap-4">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-blue-800/80 leading-relaxed">
            Lưu ý: Minh chứng tải lên phải là bản gốc có dấu mộc hoặc hình ảnh xác nhận từ ban tổ chức. 
            Mọi hành vi gian lận hồ sơ sẽ bị hủy bỏ kết quả xét duyệt ngay lập tức.
          </p>
        </div>
      )}

    </div>
  );
}
