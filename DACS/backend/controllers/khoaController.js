const supabase = require('../config/db');
const { HttpError, handleError, requireId } = require('../utils/http');

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
    handleError(res, err, 'khoa');
  }
};

// POST /api/khoa
exports.create = async (req, res) => {
  try {
    const { ma_khoa, ten_khoa } = req.body;
    if (!ma_khoa || !ten_khoa) throw new HttpError(400, 'Vui lòng nhập mã khoa và tên khoa');
    const { data, error } = await supabase
      .from('khoa')
      .insert([{ ma_khoa, ten_khoa }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'khoa');
  }
};

// PUT /api/khoa/:id
exports.update = async (req, res) => {
  try {
    const { ma_khoa, ten_khoa } = req.body;
    const { data, error } = await supabase
      .from('khoa')
      .update({ ma_khoa, ten_khoa })
      .eq('id', requireId(req.params.id))
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'khoa');
  }
};

// DELETE /api/khoa/:id
exports.remove = async (req, res) => {
  try {
    const { error } = await supabase.from('khoa').delete().eq('id', requireId(req.params.id));
    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa khoa' });
  } catch (err) {
    handleError(res, err, 'khoa');
  }
};
