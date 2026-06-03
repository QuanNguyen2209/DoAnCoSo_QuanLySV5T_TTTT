"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Facebook, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated } = useAuthStore();

  // Dynamic activities
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

  // Nếu đã đăng nhập, redirect
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Form state
  const [hoTen, setHoTen] = useState("");
  const [email, setEmail] = useState("");
  const [maSv, setMaSv] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate
    if (!maSv.trim()) {
      setError("Vui lòng nhập mã sinh viên");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (!agreedTerms) {
      setError("Vui lòng đồng ý với Điều khoản dịch vụ");
      return;
    }

    setLoading(true);

    const result = await register(hoTen, email, password, maSv);

    if (result.success) {
      setSuccess(result.message || "Đăng ký thành công! Đang chuyển về trang đăng nhập...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setError(result.error || "Đăng ký thất bại");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex w-full font-sans">
      {/* Cột trái: Form đăng ký */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 py-12 relative z-10 overflow-y-auto">

        {/* Header / Logo */}
        <div className="flex items-center justify-center mb-10 w-full">
          <img
            src="/imgs/logo_hutech.jpg"
            alt="Logo Hutech"
            className="w-full max-w-[380px] h-auto object-contain bg-white"
          />
        </div>

        {/* Tiêu đề */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#14349c] mb-4 leading-relaxed uppercase" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            TẠO TÀI KHOẢN MỚI
          </h1>
          <p className="text-slate-500 font-medium">
            Điền thông tin của bạn để tham gia Hệ thống Quản lý Sinh viên 5 tốt.
          </p>
        </div>

        {/* Form Đăng ký */}
        <form className="space-y-4" onSubmit={handleRegister}>

          {/* Hiển thị lỗi */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl"
            >
              {error}
            </motion.div>
          )}

          {/* Hiển thị thành công */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-700 text-sm font-medium px-4 py-3 rounded-xl"
            >
              {success}
            </motion.div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Họ và tên</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email sinh viên</label>
            <div className="relative">
              <input
                type="email"
                placeholder="2202xxxx@vnu.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Mã sinh viên <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="2202xxxx"
                value={maSv}
                onChange={(e) => setMaSv(e.target.value)}
                className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 pr-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-bold tracking-widest"
                required
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
            <label className="block text-sm font-bold text-slate-700 mb-2">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 pr-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-bold tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2 pb-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="w-4 h-4 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="terms" className="text-sm font-medium text-slate-600 cursor-pointer">
              Tôi đồng ý với <a href="#" className="text-blue-600 hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-blue-600 hover:underline">Chính sách bảo mật</a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-4 rounded-full transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Đang đăng ký..." : "Đăng ký tài khoản"}
          </button>

          <div className="text-center mt-6">
            <span className="text-sm font-medium text-slate-500">Đã có tài khoản? </span>
            <Link href="/login" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Đăng nhập</Link>
          </div>
        </form>

        {/* Social Login */}
        <div className="mt-8 mb-6">
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400">Hoặc đăng ký với</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => alert("Tính năng đang phát triển")}
              className="flex items-center justify-center gap-2 py-3 rounded-full bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-sm font-semibold text-slate-700"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => alert("Tính năng đang phát triển")}
              className="flex items-center justify-center gap-2 py-3 rounded-full bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-sm font-semibold text-slate-700"
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              Facebook
            </button>
          </div>
        </div>

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

          {/* Dynamic Info Banner in the top whitespace */}
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
