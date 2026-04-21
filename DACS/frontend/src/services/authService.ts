import api from '@/lib/axios';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  ho_ten: string;
  email: string;
  password: string;
  ma_sv?: string;
}

export interface User {
  id: number;
  ho_ten: string;
  email: string;
  ma_sv: string | null;
  role: 'sinh_vien' | 'lop_truong' | 'can_bo' | 'admin';
  avatar_url: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const response = await api.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },

  register: async (payload: RegisterPayload) => {
    const response = await api.post<{ success: boolean; message: string; data: User }>('/auth/register', payload);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<{ success: boolean; data: User }>('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
    return response.data;
  },
};
