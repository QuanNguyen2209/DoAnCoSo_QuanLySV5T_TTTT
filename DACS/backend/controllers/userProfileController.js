const supabase = require('../config/db');
const { invalidateUserCache } = require('../middleware/auth');
const { HttpError, handleError, pick, toId, safeExt } = require('../utils/http');

// Các cột E-Profile được phép cập nhật (chống ghi đè id / user_id / created_at...)
const PROFILE_FIELDS = [
  'gioi_tinh', 'ngay_sinh', 'dan_toc', 'ton_giao', 'dia_chi_thuong_tru',
  'so_dien_thoai',
  'nam_hoc', 'trinh_do_dao_tao', 'diem_tich_luy', 'diem_ren_luyen',
  'ly_luan_chinh_tri', 'ngoai_ngu', 'tin_hoc',
  'minh_chung_hoc_tap', 'minh_chung_ngoai_ngu', 'minh_chung_tin_hoc',
  'chuc_vu_doan_hoi',
  'don_vi_doan_truc_thuoc', 'ngay_ket_nap_doan', 'thong_tin_chinh_tri',
];
// Cột kiểu DATE / số: chuỗi rỗng phải đổi thành null, nếu không Postgres báo lỗi
const NULLABLE_TYPED_FIELDS = ['ngay_sinh', 'ngay_ket_nap_doan', 'diem_tich_luy', 'diem_ren_luyen'];

function normalizeProfile(input) {
  const data = pick(input, PROFILE_FIELDS);
  for (const k of NULLABLE_TYPED_FIELDS) {
    if (data[k] === '') data[k] = null;
  }
  if (data.diem_tich_luy != null) {
    const v = Number(data.diem_tich_luy);
    if (!Number.isFinite(v) || v < 0 || v > 10) throw new HttpError(400, 'Điểm tích lũy không hợp lệ');
  }
  if (data.diem_ren_luyen != null) {
    const v = Number(data.diem_ren_luyen);
    if (!Number.isInteger(v) || v < 0 || v > 100) throw new HttpError(400, 'Điểm rèn luyện phải là số nguyên 0–100');
  }
  return data;
}

// GET /api/user-profiles/me — Thông tin cơ bản + E-Profile (2 truy vấn chạy song song)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userRes, profileRes] = await Promise.all([
      supabase
        .from('users')
        .select('id, ho_ten, email, ma_sv, avatar_url, role, lop_id, lop_hoc(id, ma_lop, ten_lop, khoa(id, ten_khoa))')
        .eq('id', userId)
        .single(),
      supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    if (userRes.error) throw userRes.error;
    if (profileRes.error) throw profileRes.error;

    res.json({ success: true, data: { user: userRes.data, profile: profileRes.data || {} } });
  } catch (err) {
    handleError(res, err, 'getProfile');
  }
};

// PUT /api/user-profiles/me — Cập nhật hoặc tạo mới E-Profile (1 lệnh upsert)
exports.upsertProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = normalizeProfile(req.body);

    // Đổi lớp (nếu có)
    if (req.body.lop_id !== undefined && req.body.lop_id !== null && req.body.lop_id !== '') {
      const lopId = toId(req.body.lop_id);
      if (!lopId) throw new HttpError(400, 'Lớp không hợp lệ');
      const { error: userUpdateError } = await supabase.from('users').update({ lop_id: lopId }).eq('id', userId);
      if (userUpdateError) throw userUpdateError;
      invalidateUserCache(userId);
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        [{ ...profileData, user_id: userId, updated_at: new Date().toISOString() }],
        { onConflict: 'user_id' }
      )
      .select()
      .single();
    if (error) throw error;

    res.json({ success: true, data, message: 'Cập nhật hồ sơ thành công' });
  } catch (err) {
    handleError(res, err, 'upsertProfile');
  }
};

// POST /api/user-profiles/me/avatar — Upload ảnh đại diện
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy file ảnh.' });
    }

    const { buffer, mimetype, originalname } = req.file;
    if (mimetype === 'image/svg+xml') {
      throw new HttpError(400, 'Không hỗ trợ ảnh SVG, vui lòng dùng PNG/JPG/WEBP');
    }
    const filePath = `avatar_${userId}_${Date.now()}.${safeExt(mimetype, originalname)}`;

    // Lấy avatar cũ để dọn sau khi cập nhật thành công
    const { data: oldUser } = await supabase.from('users').select('avatar_url').eq('id', userId).maybeSingle();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, { contentType: mimetype, upsert: false });
    if (uploadError) throw uploadError;

    const publicUrl = supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('id', userId)
      .select('id, ho_ten, email, ma_sv, avatar_url')
      .single();
    if (updateError) throw updateError;

    // Xoá file avatar cũ trên Storage (best-effort) để không tích tụ file rác
    const marker = '/object/public/avatars/';
    const oldUrl = oldUser?.avatar_url || '';
    if (oldUrl.includes(marker)) {
      const oldPath = decodeURIComponent(oldUrl.split(marker)[1]);
      if (oldPath && oldPath !== filePath) supabase.storage.from('avatars').remove([oldPath]).catch(() => {});
    }

    res.json({
      success: true,
      data: { avatar_url: publicUrl, user: updatedUser },
      message: 'Cập nhật ảnh đại diện thành công',
    });
  } catch (err) {
    handleError(res, err, 'uploadAvatar');
  }
};
