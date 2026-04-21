import api from '@/lib/axios';

export interface ReviewApplication {
  id: number;
  ma_ho_so: string;
  sinh_vien_id: number;
  ky_xet_duyet_id: number;
  loai_doi_tuong: 'individual' | 'collective';
  trang_thai: 'pending' | 'reviewing' | 'approved' | 'rejected';
  ghi_chu_sv?: string;
  phan_hoi_duyet?: string;
  ngay_nop?: string;
  ngay_duyet?: string;
  created_at: string;
  users?: {
    id: number;
    ho_ten: string;
    ma_sv: string;
    email: string;
    avatar_url?: string;
    lop_hoc?: {
      id: number;
      ma_lop: string;
      ten_lop: string;
      khoa?: { id: number; ten_khoa: string };
    };
  };
  ky_xet_duyet?: {
    id: number;
    ten_ky: string;
    nam_hoc: string;
    trang_thai: string;
  };
  minh_chung?: {
    id: number;
    ten_thanh_tich: string;
    tieu_chi_id: number;
  }[];
}

export interface ReviewStats {
  classes: {
    id: number;
    ma_lop: string;
    ten_lop: string;
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }[];
  totals: {
    total: number;
    pending: number;
    reviewing?: number;
    approved: number;
    rejected: number;
  };
}

export const reviewerService = {
  // Lấy danh sách hồ sơ được phân công
  getApplications: async (params?: { trang_thai?: string; search?: string }) => {
    const response = await api.get<{ success: boolean; data: ReviewApplication[] }>('/reviewer/applications', { params });
    return response.data.data;
  },

  // Lấy chi tiết 1 hồ sơ
  getApplicationDetail: async (id: number) => {
    const response = await api.get<{ success: boolean; data: any }>(`/reviewer/applications/${id}`);
    return response.data.data;
  },

  // Duyệt hoặc từ chối hồ sơ
  reviewApplication: async (id: number, action: 'approved' | 'rejected', phan_hoi_duyet?: string) => {
    const response = await api.put<{ success: boolean; data: any; message: string }>(`/reviewer/applications/${id}/review`, {
      action,
      phan_hoi_duyet
    });
    return response.data;
  },

  // Thống kê
  getStats: async () => {
    const response = await api.get<{ success: boolean; data: ReviewStats }>('/reviewer/stats');
    return response.data.data;
  },

  // Lấy danh sách lớp được phân công
  getAssignedClasses: async () => {
    const response = await api.get<{ success: boolean; data: any[] }>('/reviewer/assigned-classes');
    return response.data.data;
  }
};
