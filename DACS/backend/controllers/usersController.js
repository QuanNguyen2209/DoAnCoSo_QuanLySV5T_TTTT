const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

// GET /api/users — Lấy danh sách tất cả user (cho Admin)
exports.getAll = async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = supabase
      .from('users')
      .select('id, ho_ten, email, ma_sv, role, avatar_url')
      .order('id', { ascending: true });

    if (role) query = query.eq('role', role);
    if (search) query = query.or(`ho_ten.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
exports.getById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, ho_ten, email, ma_sv, role, avatar_url, lop_hoc(id, ma_lop, ten_lop, khoa(id, ten_khoa))')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/users/:id — Cập nhật thông tin
exports.update = async (req, res) => {
  try {
    // Không cho phép cập nhật email, role, password qua route này
    const { ho_ten, avatar_url } = req.body;
    const { data, error } = await supabase
      .from('users')
      .update({ ho_ten, avatar_url })
      .eq('id', req.params.id)
      .select('id, ho_ten, email, ma_sv, role, avatar_url')
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/users/:id — Admin xóa người dùng
exports.deleteUser = async (req, res) => {
  try {
    const targetId = parseInt(req.params.id);

    // Không cho phép tự xóa chính mình
    if (req.user && req.user.id === targetId) {
      return res.status(400).json({ success: false, error: 'Không thể tự xóa tài khoản của mình' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', targetId);

    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/users — Admin tạo người dùng mới
exports.createUser = async (req, res) => {
  try {
    const { ho_ten, email, password, ma_sv, role } = req.body;

    if (!ho_ten || !email || !password) {
      return res.status(400).json({ success: false, error: 'Vui lòng điền đầy đủ thông tin bắt buộc (họ tên, email, mật khẩu)' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const validRoles = ['sinh_vien', 'lop_truong', 'can_bo', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'sinh_vien';

    // Kiểm tra email trùng
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(409).json({ success: false, error: 'Email này đã được đăng ký' });
    }

    const salt = await bcrypt.genSalt(8);
    const password_hash = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('users')
      .insert([{ ho_ten, email, password_hash, ma_sv: ma_sv || null, role: userRole }])
      .select('id, ho_ten, email, ma_sv, role, avatar_url')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, message: 'Tạo người dùng thành công', data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
