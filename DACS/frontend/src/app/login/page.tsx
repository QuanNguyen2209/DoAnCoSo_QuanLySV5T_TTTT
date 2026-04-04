"use client";

import { motion } from "framer-motion";
import { User, CheckSquare, Shield, Users, Mail, Lock, Facebook } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/"); // Chuyển hướng sang trang Dashboard (Root của group dashboard)
  };

  return (
    <div className="min-h-screen bg-white flex w-full font-sans">
      {/* Cột trái: Form đăng nhập */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 xl:px-32 py-12 relative z-10">
        
        {/* Header / Logo */}
        <div className="flex items-center gap-3 mb-10">
          <img 
            src="https://upload.wikimedia.org/wikipedia/vi/a/a9/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png" 
            alt="Logo Đoàn Thanh Niên" 
            className="w-12 h-12 object-contain drop-shadow-sm"
          />
          <span className="font-bold text-blue-800 text-xl tracking-tight uppercase">Scholastic Kinetic</span>
        </div>

        {/* Tiêu đề */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-900 mb-4 leading-tight tracking-tight uppercase">
            Hệ thống Quản lý<br />Sinh viên 5 tốt và<br />Tập thể Tiên tiến
          </h1>
          <p className="text-slate-500 font-medium">
            Chào mừng bạn quay trở lại. Hãy chọn vai trò của mình để bắt đầu.
          </p>
        </div>

        {/* Chọn vai trò */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { id: 'student', title: 'Sinh viên', icon: <User className="w-5 h-5 mb-1" /> },
            { id: 'reviewer', title: 'Người duyệt', icon: <CheckSquare className="w-5 h-5 mb-1" /> },
            { id: 'admin', title: 'Admin', icon: <Shield className="w-5 h-5 mb-1 text-orange-600" /> },
            { id: 'monitor', title: 'Lớp trưởng', icon: <Users className="w-5 h-5 mb-1" /> },
          ].map((role) => (
            <button
              key={role.id}
              className={`flex flex-col items-center justify-center py-4 rounded-2xl transition-all border-2 text-xs font-semibold
                ${role.id === 'student' 
                  ? 'bg-blue-50 border-blue-100 text-slate-800' 
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
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email sinh viên</label>
            <div className="relative">
              <input 
                type="email" 
                placeholder="student@vnu.edu.vn" 
                className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-slate-700">Mật khẩu</label>
              <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700">Quên mật khẩu?</button>
            </div>
            <div className="relative">
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-indigo-50/50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all placeholder:text-slate-400 font-bold tracking-widest"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 pb-2">
            <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="remember" className="text-sm font-medium text-slate-600 cursor-pointer">Duy trì đăng nhập</label>
          </div>

          <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-4 rounded-full transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)]">
            Đăng nhập
          </button>
        </form>

        {/* Social Login */}
        <div className="mt-8">
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-slate-400">Hoặc đăng nhập với</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="flex items-center justify-center gap-2 py-3 rounded-full bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-sm font-semibold text-slate-700">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button type="button" className="flex items-center justify-center gap-2 py-3 rounded-full bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-sm font-semibold text-slate-700">
              <Facebook className="w-5 h-5 text-blue-600" />
              Facebook
            </button>
          </div>
        </div>

      </div>

      {/* Cột phải: Background Image & Card */}
      <div className="hidden lg:block lg:w-1/2 relative p-4">
        <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-blue-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <img 
            src="/imgs/anh_trang_dang_nhap.jpg" 
            alt="Student on campus" 
            className="absolute inset-0 w-full h-full object-cover opacity-[0.85] mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>

          {/* Floating Stats Card */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="absolute top-1/3 left-10 bg-white/90 backdrop-blur-md p-4 pr-10 rounded-2xl flex items-center gap-4 shadow-xl"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">5,000+ Sinh viên</p>
              <p className="text-xs text-slate-500 font-medium">Đã đạt danh hiệu Sinh viên 5 tốt</p>
            </div>
          </motion.div>

          {/* Testimonial Card */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, type: 'spring' }}
            className="absolute bottom-16 left-10 right-10 bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl"
          >
            <div className="inline-block px-3 py-1 bg-orange-100 text-orange-600 text-xs font-bold rounded-full mb-4">MỚI NHẤT</div>
            <h2 className="text-2xl xl:text-3xl font-bold text-slate-900 mb-4 leading-tight tracking-tight">
              &quot;Biến mọi nỗ lực thành những cột mốc rực rỡ.&quot;
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Scholastic Kinetic giúp bạn theo dõi lộ trình rèn luyện, đăng ký các danh hiệu học thuật và ghi dấu những thành tựu ngoại khóa đáng tự hào.
            </p>

            {/* Pagination dots */}
            <div className="flex gap-2 mt-8">
              <div className="w-8 h-1.5 bg-slate-900 rounded-full"></div>
              <div className="w-3 h-1.5 bg-slate-300 rounded-full"></div>
              <div className="w-3 h-1.5 bg-slate-300 rounded-full"></div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Footer text absolute */}
      <div className="absolute bottom-0 w-full p-6 flex justify-between items-center text-xs font-medium text-slate-500 bg-white">
        <div>© 2026 Đại học Scholastic Kinetic Việt Nam</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-800">Về chúng tôi</a>
          <a href="#" className="hover:text-slate-800">Hỗ trợ kỹ thuật</a>
          <a href="#" className="hover:text-slate-800">Chính sách bảo mật</a>
          <a href="#" className="hover:text-slate-800">Cổng thông tin Đại học</a>
        </div>
      </div>

    </div>
  );
}
