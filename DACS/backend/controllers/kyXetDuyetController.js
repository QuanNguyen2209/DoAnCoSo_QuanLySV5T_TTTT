const supabase = require('../config/db');

// GET /api/ky-xet-duyet — Lấy tất cả kỳ xét duyệt
exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ky_xet_duyet')
      .select('*')
      .order('ngay_bat_dau', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/ky-xet-duyet/:id
exports.getById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ky_xet_duyet')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/ky-xet-duyet
exports.create = async (req, res) => {
  try {
    const { ten_ky, mo_ta, loai, nam_hoc, ngay_bat_dau, ngay_ket_thuc, trang_thai } = req.body;
    const { data, error } = await supabase
      .from('ky_xet_duyet')
      .insert([{ ten_ky, mo_ta, loai, nam_hoc, ngay_bat_dau, ngay_ket_thuc, trang_thai }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/ky-xet-duyet/:id
exports.update = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ky_xet_duyet')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/ky-xet-duyet/:id
exports.remove = async (req, res) => {
  try {
    const { error } = await supabase
      .from('ky_xet_duyet')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
