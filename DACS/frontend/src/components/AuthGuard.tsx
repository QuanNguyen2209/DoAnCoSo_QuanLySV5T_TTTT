"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { Loader2 } from "lucide-react";

// Trả về đường dẫn cần chuyển hướng (nếu user không được phép ở trang hiện tại)
function getRedirect(pathname: string, isAuthenticated: boolean, role?: string): string | null {
  if (!isAuthenticated || !role) {
    const here = typeof window !== "undefined" ? pathname + window.location.search : pathname;
    return here && here !== "/" ? `/login?next=${encodeURIComponent(here)}` : "/login";
  }
  if (pathname.startsWith("/admin") && role !== "admin") return "/";
  if (pathname.startsWith("/reviewer") && role !== "can_bo" && role !== "admin") return "/";
  return null;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      checkAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redirectTo = isLoading ? null : getRedirect(pathname, isAuthenticated && !!user, user?.role);

  // Điều hướng trong useEffect (gọi router.push ngay khi render gây cảnh báo React & render lặp)
  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (isLoading || redirectTo) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
