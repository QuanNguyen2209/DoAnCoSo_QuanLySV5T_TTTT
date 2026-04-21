import { create } from 'zustand';
import { authService, User } from '@/services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (ho_ten: string, email: string, password: string, ma_sv?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('sv5t_token') : null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    try {
      const result = await authService.login({ email, password });
      if (result.success) {
        const { user, token } = result.data;
        localStorage.setItem('sv5t_token', token);
        set({ user, token, isAuthenticated: true });
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (err: any) {
      const message = err.response?.data?.error || 'Đã xảy ra lỗi khi đăng nhập';
      return { success: false, error: message };
    }
  },

  register: async (ho_ten, email, password, ma_sv) => {
    try {
      const result = await authService.register({ ho_ten, email, password, ma_sv });
      if (result.success) {
        return { success: true, message: result.message };
      }
      return { success: false, error: result.message };
    } catch (err: any) {
      const message = err.response?.data?.error || 'Đã xảy ra lỗi khi đăng ký';
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('sv5t_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('sv5t_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      set({ token });
      const result = await authService.getMe();
      if (result.success) {
        set({ user: result.data, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem('sv5t_token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      localStorage.removeItem('sv5t_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  forgotPassword: async (email) => {
    try {
      const result = await authService.forgotPassword(email);
      return { success: result.success, message: result.message };
    } catch (err: any) {
      const message = err.response?.data?.error || 'Đã xảy ra lỗi';
      return { success: false, error: message };
    }
  },
}));
