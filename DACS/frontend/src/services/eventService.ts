import api from '@/lib/axios';

// ── Types ───────────────────────────────────────────────────────

export interface EventCriterion {
  id: number;
  ten_tieu_chi: string;
  mo_ta?: string | null;
  thu_tu?: number;
  parent_id: number | null;
  loai_doi_tuong: 'individual' | 'collective';
  children?: EventCriterion[];
}

export interface EventItem {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  image_url?: string | null;
  criteria_ids?: number[];
  criteria?: EventCriterion[];
  start_time: string;
  end_time: string;
  max_participants: number;
  status: 'draft' | 'published' | 'closed';
  attendance_code?: string; // chỉ admin thấy
  is_attendance_open: boolean;
  attendance_expires_at: string | null;
  created_by: number;
  created_at: string;
  registered_count: number;
  created_by_user?: { id: number; ho_ten: string };
  my_registration?: EventRegistration | null;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  student_id: number;
  registered_at: string;
  status: 'registered' | 'attended' | 'cancelled';
  attended_at: string | null;
  student?: { id: number; ho_ten: string; ma_sv: string; email: string };
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  location?: string;
  image_url?: string;
  criteria_ids?: number[];
  start_time: string;
  end_time: string;
  max_participants?: number;
  status?: 'draft' | 'published' | 'closed';
}

// ── Service ─────────────────────────────────────────────────────

export const eventService = {
  // Danh sách sự kiện
  getAll: async (status?: string) => {
    const response = await api.get<{ success: boolean; data: EventItem[] }>('/events', {
      params: status ? { status } : undefined,
    });
    return response.data.data;
  },

  // Chi tiết sự kiện
  getById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: EventItem }>(`/events/${id}`);
    return response.data.data;
  },

  // Admin: Tạo sự kiện
  create: async (payload: CreateEventPayload) => {
    const response = await api.post<{ success: boolean; data: EventItem }>('/events', payload);
    return response.data.data;
  },

  // Admin: Cập nhật sự kiện
  update: async (id: number, payload: Partial<CreateEventPayload>) => {
    const response = await api.put<{ success: boolean; data: EventItem }>(`/events/${id}`, payload);
    return response.data.data;
  },

  // Admin: Xóa sự kiện
  remove: async (id: number) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/events/${id}`);
    return response.data;
  },

  // Student: Đăng ký sự kiện
  register: async (eventId: number) => {
    const response = await api.post<{ success: boolean; data: EventRegistration; message: string }>(`/events/${eventId}/register`);
    return response.data;
  },

  // Student: Hủy đăng ký
  cancelRegistration: async (eventId: number) => {
    const response = await api.post<{ success: boolean; data: EventRegistration; message: string }>(`/events/${eventId}/cancel-registration`);
    return response.data;
  },

  // Admin: Sinh mã điểm danh
  generateAttendanceCode: async (eventId: number, expiresInMinutes: number = 30) => {
    const response = await api.post<{ success: boolean; data: { attendance_code: string; is_attendance_open: boolean; attendance_expires_at: string }; message: string }>(
      `/events/${eventId}/generate-attendance-code`,
      { expires_in_minutes: expiresInMinutes }
    );
    return response.data;
  },

  // Admin: Đóng cổng điểm danh
  closeAttendance: async (eventId: number) => {
    const response = await api.post<{ success: boolean; message: string }>(`/events/${eventId}/close-attendance`);
    return response.data;
  },

  // Student: Điểm danh (nhập mã)
  checkIn: async (eventId: number, code: string) => {
    const response = await api.post<{ success: boolean; data: EventRegistration; message: string }>(
      `/events/${eventId}/check-in`,
      { code }
    );
    return response.data;
  },

  // Admin: Xem danh sách điểm danh
  getAttendanceList: async (eventId: number) => {
    const response = await api.get<{ success: boolean; data: EventRegistration[] }>(`/events/${eventId}/attendance-list`);
    return response.data.data;
  },

  // Lấy tất cả tiêu chí (SV5T & Tập thể)
  getCriteria: async () => {
    const response = await api.get<{ success: boolean; data: EventCriterion[] }>('/tieu-chi');
    return response.data.data;
  },

  // Admin: Tải ảnh banner từ máy tính lên Supabase Storage
  uploadBanner: async (file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    const response = await api.post<{ success: boolean; data: { url: string; fileName: string }; message: string }>(
      '/events/upload-banner',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
