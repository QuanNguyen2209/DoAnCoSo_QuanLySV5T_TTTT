import api from '@/lib/axios';

export interface UserProfile {
  id?: number;
  user_id?: number;
  gioi_tinh?: string;
  ngay_sinh?: string;
  dan_toc?: string;
  ton_giao?: string;
  dia_chi_thuong_tru?: string;
  so_dien_thoai?: string;
  nam_hoc?: string;
  trinh_do_dao_tao?: string;
  diem_tich_luy?: number;
  diem_ren_luyen?: number;
  ly_luan_chinh_tri?: string;
  ngoai_ngu?: string;
  tin_hoc?: string;
  minh_chung_hoc_tap?: string;
  minh_chung_ngoai_ngu?: string;
  minh_chung_tin_hoc?: string;
  chuc_vu_doan_hoi?: string;
  don_vi_doan_truc_thuoc?: string;
  ngay_ket_nap_doan?: string;
  thong_tin_chinh_tri?: string;
}

export interface FullProfileData {
  user: {
    id: number;
    ho_ten: string;
    email: string;
    ma_sv: string;
    avatar_url: string;
    lop_hoc: {
      ma_lop: string;
      ten_lop: string;
      khoa: {
        ten_khoa: string;
      };
    };
  };
  profile: UserProfile;
}

export const profileService = {
  // Lấy hồ sơ hiện tại
  getMe: async (): Promise<FullProfileData> => {
    const response = await api.get('/user-profiles/me');
    return response.data.data;
  },

  // Cập nhật hồ sơ
  updateMe: async (data: UserProfile): Promise<UserProfile> => {
    const response = await api.put('/user-profiles/me', data);
    return response.data.data;
  }
};
