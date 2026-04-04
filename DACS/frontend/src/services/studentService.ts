import api from '@/lib/axios';

export interface Criterion {
  id: number;
  ten_tieu_chi: string;
  mo_ta: string;
  loai_doi_tuong: 'individual' | 'collective' | 'both';
  thu_tu: number;
}

export interface Period {
  id: number;
  ten_ky: string;
  mo_ta: string;
  loai: 'hk1' | 'hk2' | 'ca_nam';
  nam_hoc: string;
  trang_thai: 'upcoming' | 'active' | 'closed';
}

export interface Application {
  id: number;
  ma_ho_so: string;
  sinh_vien_id: number;
  ky_xet_duyet_id: number;
  loai_doi_tuong: 'individual' | 'collective';
  trang_thai: 'draft' | 'pending' | 'reviewing' | 'approved' | 'rejected';
  ghi_chu_sv?: string;
  ngay_nop?: string;
  ky_xet_duyet?: {
    ten_ky: string;
    nam_hoc: string;
  };
}

export interface Proof {
  id?: number;
  ho_so_id: number;
  tieu_chi_id: number;
  ten_thanh_tich: string;
  mo_ta: string;
  cap_thanh_tich: 'truong' | 'khoa' | 'khac';
  ngay_ghi_nhan: string;
  file_url?: string;
  file_name?: string;
}

export const studentService = {
  // 1. Fetch criteria and periods
  getCriteria: async (type?: 'individual' | 'collective') => {
    const response = await api.get<{ success: boolean; data: Criterion[] }>('/tieu-chi', {
      params: { loai_doi_tuong: type }
    });
    return response.data.data;
  },

  getActivePeriods: async () => {
    const response = await api.get<{ success: boolean; data: Period[] }>('/ky-xet-duyet/active');
    return response.data.data;
  },

  // 2. Application management
  getRecords: async (sinhVienId: number) => {
    const response = await api.get<{ success: boolean; data: Application[] }>('/ho-so', {
      params: { sinh_vien_id: sinhVienId }
    });
    return response.data.data;
  },

  createDraft: async (data: Partial<Application>) => {
    const response = await api.post<{ success: boolean; data: Application }>('/ho-so', data);
    return response.data.data;
  },

  updateApplication: async (id: number, data: Partial<Application>) => {
    const response = await api.put<{ success: boolean; data: Application }>(`/ho-so/${id}`, data);
    return response.data.data;
  },

  submitApplication: async (id: number, sinhVienId: number) => {
    const response = await api.post<{ success: boolean; data: Application }>(`/ho-so/${id}/submit`, {
      sinh_vien_id: sinhVienId
    });
    return response.data;
  },

  deleteDraft: async (id: number) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/ho-so/${id}`);
    return response.data;
  },

  // 3. Proof management
  addProof: async (data: Proof) => {
    const response = await api.post<{ success: boolean; data: Proof }>('/minh-chung', data);
    return response.data.data;
  },

  getUploadUrl: async (folderId: number, fileName: string, fileType: string) => {
    const response = await api.post<{ success: boolean; data: any }>('/minh-chung/upload-url', {
      file_name: fileName,
      file_type: fileType,
      ho_so_id: folderId
    });
    return response.data.data;
  }
};
