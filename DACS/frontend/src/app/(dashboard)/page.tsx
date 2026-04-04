"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Heart, Users, GraduationCap, ClipboardList } from "lucide-react";

export default function DashboardHome() {
  return (
    <div className="p-8 flex-1 w-full max-w-[1200px] mx-auto">
      {/* Welcome Banner Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-sm"
        style={{
          background: "linear-gradient(135deg, #d8eeff 0%, #e8e0ff 50%, #fbd5e8 100%)"
        }}
      >
          <div className="flex flex-col md:flex-row relative z-10 w-full h-full items-center">
              
              {/* Left Text Content */}
              <div className="flex-1 max-w-xl">
                <p className="text-xs font-bold text-slate-500/80 mb-2 tracking-widest uppercase">CHÀO MỪNG TRỞ LẠI</p>
                <h1 className="text-4xl md:text-5xl font-medium text-slate-800 mb-4 tracking-tight">Xin chào Nguyễn Lê Nguyên Quân!</h1>
                <p className="text-slate-700 mb-8 font-medium">Hãy hoàn tất hồ sơ Sinh viên 5 tốt trước hạn.</p>

                {/* Features List */}
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-pink-400 shrink-0" fill="currentColor" />
                    Đăng ký xét duyệt thực hiện nhanh chóng chỉ với một vài thao tác.
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <Calendar className="w-5 h-5 text-pink-400 shrink-0" />
                    Quản lý minh chứng hiện đại – Báo cáo tạo ngay chỉ với một chạm.
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <Heart className="w-5 h-5 text-pink-400 shrink-0" fill="currentColor" />
                    Quản lý hồ sơ, thời hạn nộp minh chứng dễ dàng – nhanh chóng.
                  </li>
                </ul>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                  <button className="px-6 py-3 bg-[#546fff] hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors shadow-md shadow-indigo-200">
                    Bắt đầu đăng ký
                  </button>
                  <button className="px-6 py-3 bg-transparent border border-indigo-300 text-indigo-600 hover:bg-white/50 text-sm font-medium rounded-xl transition-colors">
                    Xem hướng dẫn
                  </button>
                </div>
              </div>

              {/* Right Visual Elements */}
              <div className="hidden lg:flex flex-1 justify-end items-center relative h-full min-h-[300px]">
                {/* Big faint circle */}
                <div className="w-[340px] h-[340px] rounded-full bg-white/40 absolute right-8 top-1/2 -translate-y-1/2 backdrop-blur-sm border border-white/50"></div>
                
                {/* Floating mini cards */}
                <motion.div 
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-8 left-1/4 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-500"
                >
                  <Users className="w-5 h-5" />
                </motion.div>

                <motion.div 
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 right-0 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-indigo-600"
                >
                  <GraduationCap className="w-5 h-5" />
                </motion.div>

                <motion.div 
                  animate={{ y: [-8, 8, -8] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-10 left-10 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-pink-500"
                >
                  <ClipboardList className="w-5 h-5" />
                </motion.div>
              </div>
          </div>
      </motion.div>
    </div>
  );
}
