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
