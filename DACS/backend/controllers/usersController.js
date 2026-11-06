const bcrypt = require('bcryptjs');
const supabase = require('../config/db');
const { invalidateUserCache } = require('../middleware/auth');
const { handleError, requireId, sanitizeSearch, escapeLike, pick, HttpError } = require('../utils/http');
const { isAdmin, isStaff } = require('../utils/access');

const VALID_ROLES = ['sinh_vien', 'lop_truong', 'can_bo', 'admin'];

// GET /api/users — Lấy danh sách tất cả user (cho Admin)
exports.getAll = async (req, res) => {
  try {
    const { role } = req.query;
    const search = sanitizeSearch(req.query.search);

    let query = supabase
      .from('users')
      .select('id, ho_ten, email, ma_sv, role, avatar_url, is_active')
      .order('id', { ascending: true });

    if (role && VALID_ROLES.includes(role)) query = query.eq('role', role);
    if (search) {
      const s = escapeLike(search);
      query = query.or(`ho_ten.ilike.%${s}%,email.ilike.%${s}%,ma_sv.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'users.getAll');
  }
};

// GET /api/users/:id — chỉ xem chính mình, hoặc admin/cán bộ
exports.getById = async (req, res) => {
  try {
    const id = requireId(req.params.id, 'Mã người dùng');
    if (id !== req.user.id && !isStaff(req.user)) {
      throw new HttpError(403, 'Bạn không có quyền xem thông tin người dùng này');
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, ho_ten, email, ma_sv, role, avatar_url, lop_hoc(id, ma_lop, ten_lop, khoa(id, ten_khoa))')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'users.getById');
  }
};

// PUT /api/users/:id — Cập nhật thông tin (chính mình hoặc admin)
exports.update = async (req, res) => {
  try {
    const id = requireId(req.params.id, 'Mã người dùng');
    if (id !== req.user.id && !isAdmin(req.user)) {
      throw new HttpError(403, 'Bạn không có quyền sửa thông tin người dùng này');
    }

    // Không cho phép cập nhật email, role, password qua route này
    const payload = pick(req.body, ['ho_ten', 'avatar_url']);
    if (payload.ho_ten !== undefined) {
      payload.ho_ten = String(payload.ho_ten).trim();
      if (!payload.ho_ten) throw new HttpError(400, 'Họ tên không được để trống');
    }
    if (Object.keys(payload).length === 0) {
      throw new HttpError(400, 'Không có dữ liệu cần cập nhật');
    }

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id)
      .select('id, ho_ten, email, ma_sv, role, avatar_url')
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
    invalidateUserCache(id);
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'users.update');
  }
};

// PUT /api/users/:id/active — Admin khoá / mở khoá tài khoản (thay cho xoá khi user đã có dữ liệu)
exports.setActive = async (req, res) => {
  try {
    const id = requireId(req.params.id, 'Mã người dùng');
    const { is_active } = req.body;
    if (typeof is_active !== 'boolean') throw new HttpError(400, 'is_active phải là true hoặc false');
    if (id === req.user.id && !is_active) throw new HttpError(400, 'Không thể tự khoá tài khoản của mình');

    const { data, error } = await supabase
      .from('users')
      .update({ is_active })
      .eq('id', id)
      .select('id, ho_ten, email, role, is_active')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });

    invalidateUserCache(id); // có hiệu lực ngay với token đang dùng
    res.json({ success: true, data, message: is_active ? 'Đã mở khoá tài khoản' : 'Đã khoá tài khoản' });
  } catch (err) {
    handleError(res, err, 'users.setActive');
  }
};

// DELETE /api/users/:id — Admin xóa người dùng
exports.deleteUser = async (req, res) => {
  try {
    const targetId = requireId(req.params.id, 'Mã người dùng');

    if (req.user.id === targetId) {
      return res.status(400).json({ success: false, error: 'Không thể tự xóa tài khoản của mình' });
    }

    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', targetId)
      .select('id');

    if (error) {
      if (error.code === '23503') {
        return res.status(409).json({
          success: false,
          error: 'Người dùng này đã có hồ sơ / dữ liệu liên quan nên không thể xóa. Hãy vô hiệu hoá hoặc đổi quyền thay vì xóa.',
        });
      }
      throw error;
    }
    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
    }

    invalidateUserCache(targetId);
    res.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (err) {
    handleError(res, err, 'users.delete');
  }
};

// POST /api/users — Admin tạo người dùng mới
exports.createUser = async (req, res) => {
  try {
    const ho_ten = String(req.body.ho_ten || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const ma_sv = req.body.ma_sv ? String(req.body.ma_sv).trim() : null;
    const { role } = req.body;

    if (!ho_ten || !email || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ thông tin bắt buộc (họ tên, email, mật khẩu)' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const userRole = VALID_ROLES.includes(role) ? role : 'sinh_vien';

    const { data: existing, error: exErr } = await supabase
      .from('users')
      .select('id')
      .ilike('email', escapeLike(email))
      .limit(1);
    if (exErr) throw exErr;
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, error: 'Email này đã được đăng ký' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{ ho_ten, email, password_hash, ma_sv, role: userRole }])
      .select('id, ho_ten, email, ma_sv, role, avatar_url')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, error: 'Email hoặc mã sinh viên đã tồn tại' });
      }
      throw error;
    }
    res.status(201).json({ success: true, message: 'Tạo người dùng thành công', data });
  } catch (err) {
    handleError(res, err, 'users.create');
  }
};
