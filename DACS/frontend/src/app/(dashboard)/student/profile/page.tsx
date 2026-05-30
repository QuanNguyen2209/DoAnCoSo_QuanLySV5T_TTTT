"use client";

import { useEffect, useState, useRef } from "react";
import { profileService, FullProfileData, UserProfile } from "@/services/profileService";
import { Save, User, Phone, BookOpen, Briefcase, Flag, Loader2, AlertCircle, CheckCircle2, School, Camera } from "lucide-react";
import api from "@/lib/axios";

export default function EProfilePage() {
  const [data, setData] = useState<FullProfileData | null>(null);
  const [formData, setFormData] = useState<UserProfile>({});
  const [khoas, setKhoas] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [selectedKhoa, setSelectedKhoa] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, khoaRes, classRes] = await Promise.all([
        profileService.getMe(),
        api.get("/khoa"),
        api.get("/lop-hoc")
      ]);
      
      setData(profileRes);
      setFormData(profileRes.profile || {});
      
      if (khoaRes.data.success) setKhoas(khoaRes.data.data);
      if (classRes.data.success) setAllClasses(classRes.data.data);

      // Nếu đã có lớp, set khoa tương ứng
      if (profileRes.user?.lop_hoc?.khoa?.id) {
        setSelectedKhoa(profileRes.user.lop_hoc.khoa.id.toString());
      }
    } catch (err: any) {
      setError("Không thể tải thông tin hồ sơ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Upload ảnh đại diện
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setError("");
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("avatar", file);
      const res = await api.post("/user-profiles/me/avatar", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        // Reload profile để cập nhật avatar
        await fetchProfile();
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Upload avatar lỗi:", err);
      setError(err?.response?.data?.error || "Không thể upload ảnh đại diện.");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess(false);
      
      // Đảm bảo lop_id được gửi dưới dạng số nếu có
      const submissionData = { ...formData };
      if (submissionData.lop_id) submissionData.lop_id = Number(submissionData.lop_id);

      await profileService.updateMe(submissionData);
      
      // Tải lại toàn bộ thông tin để cập nhật UI (bao gồm cả data.user.lop_hoc mới)
      await fetchProfile();
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError("Lỗi khi lưu hồ sơ. Vui lòng kiểm tra lại.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar với nút upload */}
          <div
            className="relative w-24 h-24 rounded-full cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            <div className="w-24 h-24 bg-white/20 rounded-full border-4 border-white/30 flex items-center justify-center overflow-hidden backdrop-blur-sm shadow-inner">
              {avatarUploading ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : data.user?.avatar_url ? (
                <img src={data.user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
            {/* Hidden file input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold mb-1">{data.user?.ho_ten}</h1>
            <p className="text-indigo-100 text-lg flex items-center justify-center md:justify-start gap-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-md">
                MSSV: {data.user?.ma_sv || "Chưa cập nhật"}
              </span>
            </p>
            <p className="text-indigo-200 text-xs mt-2">Nhấn vào ảnh đại diện để thay đổi</p>
          </div>
        </div>
      </div>


      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl flex items-center gap-3 border border-emerald-100 transition-all">
          <CheckCircle2 className="w-5 h-5" />
          Lưu thông tin thành công!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Khối 1: Thông tin cá nhân */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User className="w-5 h-5" /></div>
            <h2 className="text-lg font-semibold text-slate-800">Thông tin cá nhân</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Giới tính</label>
              <select name="gioi_tinh" value={formData.gioi_tinh || ""} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                <option value="">Chọn giới tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Ngày sinh</label>
              <input type="date" name="ngay_sinh" value={formData.ngay_sinh ? formData.ngay_sinh.split('T')[0] : ""} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Dân tộc</label>
              <input type="text" name="dan_toc" value={formData.dan_toc || ""} onChange={handleInputChange} placeholder="VD: Kinh" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tôn giáo</label>
              <input type="text" name="ton_giao" value={formData.ton_giao || ""} onChange={handleInputChange} placeholder="VD: Không" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ thường trú</label>
              <input type="text" name="dia_chi_thuong_tru" value={formData.dia_chi_thuong_tru || ""} onChange={handleInputChange} placeholder="Nhập địa chỉ đầy đủ" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
          </div>
        </section>

        {/* Khối 2: Thông tin liên hệ */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Phone className="w-5 h-5" /></div>
            <h2 className="text-lg font-semibold text-slate-800">Thông tin liên hệ</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại</label>
              <input type="tel" name="so_dien_thoai" value={formData.so_dien_thoai || ""} onChange={handleInputChange} placeholder="09xxxxxxxxx" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email (Tài khoản)</label>
              <input type="email" value={data.user?.email || ""} readOnly className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none" />
            </div>
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Khoa / Viện quản lý</label>
                <select 
                  value={selectedKhoa} 
                  onChange={(e) => {
                    setSelectedKhoa(e.target.value);
                    setFormData(prev => ({ ...prev, lop_id: undefined })); // Reset lớp khi đổi khoa
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
                >
                  <option value="">-- Chọn Khoa/Viện --</option>
                  {khoas.map(k => (
                    <option key={k.id} value={k.id}>{k.ten_khoa}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Lớp sinh hoạt</label>
                <select 
                  name="lop_id"
                  value={formData.lop_id || data.user?.lop_id || ""} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
                >
                  <option value="">-- Chọn Lớp --</option>
                  {allClasses
                    .filter(c => !selectedKhoa || c.khoa_id?.toString() === selectedKhoa)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.ma_lop} - {c.ten_lop}</option>
                    ))
                  }
                </select>
              </div>
              <div className="md:col-span-2 flex items-center gap-2 text-[10px] text-amber-600 font-bold px-1">
                <AlertCircle className="w-3 h-3" />
                <span>Vui lòng chọn đúng Lớp để Cán bộ có thể thấy và xét duyệt hồ sơ của bạn.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Khối 3: Thông tin đào tạo */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><BookOpen className="w-5 h-5" /></div>
            <h2 className="text-lg font-semibold text-slate-800">Thông tin đào tạo & Năng lực</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Năm học</label>
              <input type="text" name="nam_hoc" value={formData.nam_hoc || ""} onChange={handleInputChange} placeholder="VD: 2022-2026" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Trình độ đào tạo</label>
              <select name="trinh_do_dao_tao" value={formData.trinh_do_dao_tao || ""} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                <option value="">Chọn trình độ</option>
                <option value="Đại học chính quy">Đại học chính quy</option>
                <option value="Cao đẳng">Cao đẳng</option>
                <option value="Liên thông">Liên thông</option>
              </select>
            </div>
            
            {/* Điểm số */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 md:col-span-2">
              <h3 className="font-medium text-slate-800 border-b border-slate-200 pb-2">Điểm học tập & Rèn luyện</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Điểm tích lũy (GPA)</label>
                  <input type="number" step="0.01" max="4.0" name="diem_tich_luy" value={formData.diem_tich_luy || ""} onChange={handleInputChange} placeholder="Hệ 4.0 (VD: 3.2)" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Điểm rèn luyện</label>
                  <input type="number" max="100" name="diem_ren_luyen" value={formData.diem_ren_luyen || ""} onChange={handleInputChange} placeholder="Thang điểm 100" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Link minh chứng (Học tập/Rèn luyện)</label>
                  <input type="url" name="minh_chung_hoc_tap" value={formData.minh_chung_hoc_tap || ""} onChange={handleInputChange} placeholder="Link Google Drive / OneDrive chụp bảng điểm..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" />
                </div>
              </div>
            </div>

            {/* Năng lực */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Lý luận chính trị</label>
                <input type="text" name="ly_luan_chinh_tri" value={formData.ly_luan_chinh_tri || ""} onChange={handleInputChange} placeholder="VD: Sơ cấp lý luận chính trị, Lớp nhận thức về Đảng..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Ngoại ngữ</label>
                  <input type="text" name="ngoai_ngu" value={formData.ngoai_ngu || ""} onChange={handleInputChange} placeholder="VD: IELTS 6.5, TOEIC 700..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-2" />
                  <input type="url" name="minh_chung_ngoai_ngu" value={formData.minh_chung_ngoai_ngu || ""} onChange={handleInputChange} placeholder="Link minh chứng chứng chỉ" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tin học</label>
                  <input type="text" name="tin_hoc" value={formData.tin_hoc || ""} onChange={handleInputChange} placeholder="VD: IC3, MOS, CNTT Cơ bản..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-2" />
                  <input type="url" name="minh_chung_tin_hoc" value={formData.minh_chung_tin_hoc || ""} onChange={handleInputChange} placeholder="Link minh chứng chứng chỉ" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm bg-slate-50" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Khối 4: Thông tin công việc */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Briefcase className="w-5 h-5" /></div>
              <h2 className="text-lg font-semibold text-slate-800">Thông tin công việc</h2>
            </div>
            <div className="p-6 flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Chức vụ Đoàn - Hội (Đang đảm nhiệm)</label>
              <textarea name="chuc_vu_doan_hoi" value={formData.chuc_vu_doan_hoi || ""} onChange={handleInputChange} rows={5} placeholder="Ví dụ: Bí thư Chi đoàn CNTT01, Lớp trưởng..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"></textarea>
            </div>
          </section>

          {/* Khối 5: Thông tin Đoàn – Đảng */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><Flag className="w-5 h-5" /></div>
              <h2 className="text-lg font-semibold text-slate-800">Thông tin Đoàn – Đảng</h2>
            </div>
            <div className="p-6 space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Đơn vị Đoàn trực thuộc</label>
                <input type="text" name="don_vi_doan_truc_thuoc" value={formData.don_vi_doan_truc_thuoc || ""} onChange={handleInputChange} placeholder="VD: Đoàn khoa CNTT" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ngày kết nạp Đoàn</label>
                <input type="date" name="ngay_ket_nap_doan" value={formData.ngay_ket_nap_doan ? formData.ngay_ket_nap_doan.split('T')[0] : ""} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Thông tin chính trị khác</label>
                <input type="text" name="thong_tin_chinh_tri" value={formData.thong_tin_chinh_tri || ""} onChange={handleInputChange} placeholder="VD: Đảng viên dự bị..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-6 flex justify-end z-20">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Đang lưu..." : "Lưu hồ sơ"}
          </button>
        </div>

      </form>
    </div>
  );
}
