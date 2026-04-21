"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  // Đang kiểm tra auth
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → redirect về login
  if (!isAuthenticated || !user) {
    router.push("/login");
    return null;
  }

  // Kiểm tra quyền truy cập theo role
  const isAdminPath = pathname.startsWith("/admin");
  const isReviewerPath = pathname.startsWith("/reviewer");

  if (isAdminPath && user.role !== "admin") {
    router.push("/");
    return null;
  }

  if (isReviewerPath && user.role !== "can_bo" && user.role !== "admin") {
    router.push("/");
    return null;
  }

  return <>{children}</>;
}
