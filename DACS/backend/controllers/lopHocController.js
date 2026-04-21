const supabase = require('../config/db');

// GET /api/lop-hoc — Lấy tất cả lớp (kèm khoa)
exports.getAll = async (req, res) => {
  try {
    const { khoa_id } = req.query;
    let query = supabase
      .from('lop_hoc')
      .select('*, khoa(id, ma_khoa, ten_khoa)')
      .order('id');

    if (khoa_id) query = query.eq('khoa_id', khoa_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/lop-hoc
exports.create = async (req, res) => {
  try {
    const { ma_lop, ten_lop, khoa_id, nien_khoa } = req.body;
    const { data, error } = await supabase
      .from('lop_hoc')
      .insert([{ ma_lop, ten_lop, khoa_id, nien_khoa }])
      .select('*, khoa(id, ma_khoa, ten_khoa)')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/lop-hoc/:id
exports.update = async (req, res) => {
  try {
    const { ma_lop, ten_lop, khoa_id, nien_khoa } = req.body;
    const { data, error } = await supabase
      .from('lop_hoc')
      .update({ ma_lop, ten_lop, khoa_id, nien_khoa })
      .eq('id', req.params.id)
      .select('*, khoa(id, ma_khoa, ten_khoa)')
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/lop-hoc/:id
exports.remove = async (req, res) => {
  try {
    const { error } = await supabase.from('lop_hoc').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa lớp' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
