"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { User, CheckSquare, Shield, Users, Mail, Lock, Facebook, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();

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

  // Nếu đã đăng nhập, redirect về dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const { forgotPassword } = useAuthStore();

  const roles = [
    { id: 'student', title: 'Sinh viên', icon: <User className="w-5 h-5 mb-1" /> },
    { id: 'reviewer', title: 'Người duyệt', icon: <CheckSquare className="w-5 h-5 mb-1" /> },
    { id: 'admin', title: 'Admin', icon: <Shield className="w-5 h-5 mb-1 text-orange-600" /> },
    { id: 'monitor', title: 'Lớp trưởng', icon: <Users className="w-5 h-5 mb-1" /> },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      // Redirect dựa trên role sẽ được xử lý tự động sau khi store cập nhật
      // Tạm thời redirect theo role đã chọn
      const user = useAuthStore.getState().user;
      if (user) {
        switch (user.role) {
          case 'admin':
            router.push('/admin/periods');
            break;
          case 'can_bo':
            router.push('/reviewer/applications');
            break;
          default:
            router.push('/');
        }
      } else {
        router.push('/');
      }
    } else {
      setError(result.error || "Đăng nhập thất bại");
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage("");

    const result = await forgotPassword(forgotEmail);
    if (result.success) {
      setForgotMessage(result.message || "Kiểm tra email của bạn!");
    } else {
      setForgotMessage(result.error || "Đã xảy ra lỗi");
    }
    setForgotLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex w-full font-sans">
      {/* Cột trái: Form đăng nhập */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 py-12 relative z-10">

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
          <h1 className="text-3xl md:text-4xl font-bold text-slate-700 mb-4 leading-relaxed uppercase text-center" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            QUẢN LÝ<br />SINH VIÊN 5 TỐT & TẬP<br />THỂ TIÊN TIẾN
          </h1>
          <p className="text-slate-500 font-medium text-center">
            Chào mừng bạn quay trở lại. Hãy chọn vai trò của mình để bắt đầu.
          </p>
        </div>

        {/* Modal Quên mật khẩu */}
        {forgotMode ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <h2 className="text-xl font-bold text-slate-800">Quên mật khẩu?</h2>
            <p className="text-sm text-slate-500">Nhập email để nhận hướng dẫn đặt lại mật khẩu.</p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <input
                type="email"
                placeholder="Email của bạn"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                required
              />
              {forgotMessage && (
                <p className="text-sm font-medium text-green-600 bg-green-50 p-3 rounded-xl">{forgotMessage}</p>
              )}
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-full transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {forgotLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Gửi yêu cầu
              </button>
            </form>

            <button
              onClick={() => { setForgotMode(false); setForgotMessage(""); }}
              className="text-sm font-bold text-blue-600 hover:text-blue-700"
            >
              ← Quay lại đăng nhập
            </button>
          </motion.div>
        ) : (
          <>
            {/* Chọn vai trò */}
            <div className="grid grid-cols-4 gap-3 mb-8">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all border-2 text-xs font-semibold
                    ${selectedRole === role.id
                      ? 'bg-blue-50 border-blue-200 text-slate-800 shadow-sm'
                      : 'bg-indigo-50/50 border-transparent text-slate-600 hover:bg-indigo-50'}`}
                  type="button"
                >
                  {role.icon}
                  {role.title}
                </button>
              ))}
            </div>

            {/* Form Đăng nhập */}
            <form className="space-y-5" onSubmit={handleLogin}>
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

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email sinh viên</label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="student@vnu.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-bold text-slate-700">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3.5 pr-12 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-bold tracking-widest"
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

              <div className="flex items-center gap-2 pt-1 pb-2">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer">Duy trì đăng nhập</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-4 rounded-full transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>

              <div className="text-center mt-6">
                <span className="text-sm font-medium text-slate-500">Chưa có tài khoản? </span>
                <Link href="/register" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">Đăng ký ngay</Link>
              </div>
            </form>

            {/* Social Login */}
            <div className="mt-8">
              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400">Hoặc đăng nhập với</span>
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
          </>
        )}

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
