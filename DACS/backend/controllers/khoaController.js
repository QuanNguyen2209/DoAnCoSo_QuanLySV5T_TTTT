const supabase = require('../config/db');

// GET /api/khoa — Lấy tất cả khoa (kèm đếm lớp)
exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('khoa')
      .select('*, lop_hoc(id)')
      .order('id');

    if (error) throw error;

    const result = (data || []).map(k => ({
      id: k.id,
      ma_khoa: k.ma_khoa,
      ten_khoa: k.ten_khoa,
      created_at: k.created_at,
      so_lop: k.lop_hoc?.length || 0,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/khoa
exports.create = async (req, res) => {
  try {
    const { ma_khoa, ten_khoa } = req.body;
    const { data, error } = await supabase
      .from('khoa')
      .insert([{ ma_khoa, ten_khoa }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/khoa/:id
exports.update = async (req, res) => {
  try {
    const { ma_khoa, ten_khoa } = req.body;
    const { data, error } = await supabase
      .from('khoa')
      .update({ ma_khoa, ten_khoa })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/khoa/:id
exports.remove = async (req, res) => {
  try {
    const { error } = await supabase.from('khoa').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa khoa' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
