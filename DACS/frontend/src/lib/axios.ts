import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000, // 8 giây — tránh spinner kẹt khi backend/Supabase không phản hồi
});

// Tự động gắn token vào mỗi request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sv5t_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Xử lý response: nếu 401 thì xóa token và redirect về login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tài khoản bị admin khoá trong lúc đang dùng → đăng xuất luôn
    const disabled = error.response?.status === 403 && /vô hiệu hoá/i.test(error.response?.data?.error || '');
    if ((error.response?.status === 401 || disabled) && typeof window !== 'undefined') {
      // Chỉ redirect nếu không phải đang ở trang login/register
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        localStorage.removeItem('sv5t_token');
        const next = path !== '/' ? `?next=${encodeURIComponent(path + window.location.search)}` : '';
        window.location.href = `/login${next}`;
      }
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
