"use client";

import { Menu, Search, Bell, ChevronDown } from "lucide-react";

export default function Header() {
  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white shrink-0">
      <div className="flex items-center gap-6">
        <button className="text-slate-500 hover:text-slate-700 lg:hidden font-bold">
          <Menu className="w-5 h-5" />
        </button>
        <button className="text-slate-500 hover:text-slate-700">
          <Search className="w-5 h-5" />
        </button>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400 ml-2">
          <button className="flex items-center gap-1 hover:text-slate-800 transition-colors">
            Apps <ChevronDown className="w-4 h-4" />
          </button>
          <button className="hover:text-slate-800 transition-colors font-semibold">Chat</button>
          <button className="hover:text-slate-800 transition-colors font-semibold">Calendar</button>
          <button className="hover:text-slate-800 transition-colors font-semibold">Email</button>
        </nav>
      </div>

      <div className="flex items-center gap-5">
        <button className="text-slate-400 hover:text-slate-700 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900">Nguyễn Lê Nguyên Quân</p>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sinh viên</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-orange-100 overflow-hidden border border-orange-200 cursor-pointer">
            <div className="w-full h-full bg-orange-200 flex items-center justify-center text-orange-600 font-bold text-sm">
              P
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
