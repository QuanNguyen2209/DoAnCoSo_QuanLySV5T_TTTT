"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, forgotPassword, resetPassword } = useAuthStore();

  const activities = [
    "🏆 Lễ tuyên dương Sinh viên 5 tốt cấp Đại học Quốc gia 2025",
    "📚 Tọa đàm 'Phương pháp học tập & NCKH hiệu quả'",
    "🏃 Giải chạy bộ sinh viên toàn thành phố 'Sức trẻ vươn xa'",
    "🤝 Chiến dịch tình nguyện 'Mùa hè xanh' 2026 sắp khởi động",
    "🌟 Hội thảo 'Sinh viên 5 tốt - Hành trang lập nghiệp'"
  ];
  const [currentActivity, setCurrentActivity] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // States for step 1 (Email)
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [loading1, setLoading1] = useState(false);
  const [message1, setMessage1] = useState("");
  const [error1, setError1] = useState("");

  // States for step 2 (OTP & New Password)
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [error2, setError2] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading1(true);
    setMessage1("");
    setError1("");

    const result = await forgotPassword(email);
    if (result.success) {
      setMessage1(result.message || "Mã xác nhận đã được gửi. Vui lòng kiểm tra email.");
      // Chuyển sang bước 2 sau 1.5s
      setTimeout(() => setStep(2), 1500);
    } else {
      setError1(result.error || "Đã xảy ra lỗi khi gửi yêu cầu.");
    }
    setLoading1(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError2("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading2(true);
    setError2("");

    const result = await resetPassword(email, otp, newPassword);
    if (result.success) {
      setSuccessMsg(result.message || "Đổi mật khẩu thành công!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setError2(result.error || "Mã xác thực không đúng hoặc đã hết hạn.");
    }
    setLoading2(false);
  };

  return (
    <div className="min-h-screen bg-white flex w-full font-sans">
      {/* Cột trái: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 py-12 relative z-10">
        
        {/* Header / Logo */}
        <div className="flex items-center justify-center mb-10 w-full">
          <img
            src="/imgs/logo_hutech.jpg"
            alt="Logo Hutech"
            className="w-full max-w-[380px] h-auto object-contain bg-white"
          />
        </div>

        <div className="mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 leading-tight">
            Quên mật khẩu?
          </h1>
          <p className="text-slate-500 font-medium">
            {step === 1 ? "Nhập địa chỉ email của bạn để nhận mã xác thực đổi mật khẩu." : "Nhập mã xác thực (OTP) được gửi về email và mật khẩu mới."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
              onSubmit={handleSendEmail}
            >
              {error1 && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
                  {error1}
                </div>
              )}
              {message1 && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium border border-green-100">
                  {message1}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email tài khoản</label>
                <input
                  type="email"
                  placeholder="student@vnu.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading1 || !email.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-4 rounded-full transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
              >
                {loading1 && <Loader2 className="w-5 h-5 animate-spin" />}
                Gửi mã xác nhận
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
              onSubmit={handleResetPassword}
            >
              {error2 && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100">
                  {error2}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium border border-green-100">
                  {successMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mã xác thực (OTP)</label>
                <input
                  type="text"
                  placeholder="Nhập 6 số..."
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-bold tracking-widest text-center text-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3.5 pr-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-bold tracking-widest"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Xác nhận mật khẩu mới</label>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-bold tracking-widest"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading2 || !otp || !newPassword || !confirmPassword || !!successMsg}
                className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-4 rounded-full transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
              >
                {loading2 && <Loader2 className="w-5 h-5 animate-spin" />}
                {successMsg ? "Đang chuyển hướng..." : "Đổi mật khẩu"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

      </div>

      {/* Cột phải: Background Image & Card */}
      <div className="hidden lg:block lg:w-1/2 relative p-4">
        <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-2xl bg-slate-50/50">
          <img
            src="/imgs/anh_trang_dang_nhap.jpg"
            alt="Student on campus"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent pointer-events-none"></div>

          <div className="absolute top-12 left-0 w-full px-8 z-10 flex justify-center">
            <div className="relative h-10 w-full max-w-xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentActivity}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center text-base lg:text-lg font-bold text-slate-700 tracking-wide drop-shadow-sm text-center"
                >
                  {activities[currentActivity]}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
