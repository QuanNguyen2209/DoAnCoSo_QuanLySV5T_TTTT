const supabase = require('../config/db');
const { HttpError, handleError, pick, requireId } = require('../utils/http');
const { periodStatus } = require('../utils/period');

// Thêm cờ dang_mo_nop (đang trong thời gian nhận hồ sơ) để frontend không phải tự tính
const withOpenFlag = (list) => (list || []).map((k) => ({ ...k, dang_mo_nop: periodStatus(k).open }));

const KY_FIELDS = ['ten_ky', 'mo_ta', 'loai', 'nam_hoc', 'ngay_bat_dau', 'ngay_ket_thuc', 'trang_thai'];
const VALID_LOAI = ['hk1', 'hk2', 'ca_nam'];
const VALID_TRANG_THAI = ['upcoming', 'active', 'closed'];

function validateKy(payload, { partial = false } = {}) {
  if (!partial && (!payload.ten_ky || !payload.nam_hoc || !payload.loai || !payload.ngay_bat_dau || !payload.ngay_ket_thuc)) {
    throw new HttpError(400, 'Vui lòng nhập đủ tên kỳ, loại kỳ, năm học, ngày bắt đầu và ngày kết thúc');
  }
  if (partial && (payload.ngay_bat_dau === '' || payload.ngay_ket_thuc === '')) {
    throw new HttpError(400, 'Ngày bắt đầu / kết thúc không được để trống');
  }
  if (payload.loai !== undefined && !VALID_LOAI.includes(payload.loai)) {
    throw new HttpError(400, 'Loại kỳ không hợp lệ (hk1 | hk2 | ca_nam)');
  }
  if (payload.trang_thai !== undefined && !VALID_TRANG_THAI.includes(payload.trang_thai)) {
    throw new HttpError(400, 'Trạng thái không hợp lệ (upcoming | active | closed)');
  }
  for (const k of ['ngay_bat_dau', 'ngay_ket_thuc']) {
    if (payload[k] === '') payload[k] = null;
  }
  if (payload.ngay_bat_dau && payload.ngay_ket_thuc &&
      new Date(payload.ngay_ket_thuc) < new Date(payload.ngay_bat_dau)) {
    throw new HttpError(400, 'Ngày kết thúc phải sau ngày bắt đầu');
  }
  return payload;
}

// GET /api/ky-xet-duyet — Lấy tất cả kỳ xét duyệt
exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ky_xet_duyet')
      .select('*')
      .order('ngay_bat_dau', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: withOpenFlag(data) });
  } catch (err) {
    handleError(res, err, 'kyXetDuyet');
  }
};

// GET /api/ky-xet-duyet/active — Chỉ kỳ đang mở
exports.getActive = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ky_xet_duyet')
      .select('*')
      .eq('trang_thai', 'active')
      .order('ngay_bat_dau', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: withOpenFlag(data) });
  } catch (err) {
    handleError(res, err, 'kyXetDuyet');
  }
};

// GET /api/ky-xet-duyet/:id
exports.getById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ky_xet_duyet')
      .select('*')
      .eq('id', requireId(req.params.id))
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'kyXetDuyet');
  }
};

// POST /api/ky-xet-duyet
exports.create = async (req, res) => {
  try {
    const payload = validateKy(pick(req.body, KY_FIELDS));
    const { data, error } = await supabase
      .from('ky_xet_duyet')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'kyXetDuyet');
  }
};

// PUT /api/ky-xet-duyet/:id
exports.update = async (req, res) => {
  try {
    // Chỉ cập nhật các cột hợp lệ (trước đây truyền thẳng req.body)
    const payload = validateKy(pick(req.body, KY_FIELDS), { partial: true });
    if (Object.keys(payload).length === 0) throw new HttpError(400, 'Không có dữ liệu cần cập nhật');

    const { data, error } = await supabase
      .from('ky_xet_duyet')
      .update(payload)
      .eq('id', requireId(req.params.id))
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'kyXetDuyet');
  }
};

// DELETE /api/ky-xet-duyet/:id
exports.remove = async (req, res) => {
  try {
    const { error } = await supabase
      .from('ky_xet_duyet')
      .delete()
      .eq('id', requireId(req.params.id));

    if (error) {
      if (error.code === '23503') {
        throw new HttpError(409, 'Kỳ xét duyệt đã có hồ sơ đăng ký, không thể xoá. Hãy chuyển trạng thái sang "closed".');
      }
      throw error;
    }
    res.json({ success: true, message: 'Đã xóa thành công' });
  } catch (err) {
    handleError(res, err, 'kyXetDuyet');
  }
};
