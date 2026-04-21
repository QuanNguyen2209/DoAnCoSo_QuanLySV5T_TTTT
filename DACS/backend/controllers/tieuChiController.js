const supabase = require('../config/db');

// GET /api/tieu-chi — Lấy tất cả tiêu chí (phân cấp cha-con)
exports.getAll = async (req, res) => {
  try {
    const { loai_doi_tuong } = req.query;
    
    let query = supabase
      .from('tieu_chi')
      .select('*')
      .eq('is_active', true)
      .order('thu_tu');

    if (loai_doi_tuong) {
      query = query.eq('loai_doi_tuong', loai_doi_tuong);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Tổ chức thành cây cha-con
    const parents = (data || []).filter(tc => !tc.parent_id);
    const children = (data || []).filter(tc => tc.parent_id);

    const tree = parents.map(p => ({
      ...p,
      children: children.filter(c => c.parent_id === p.id).sort((a, b) => a.thu_tu - b.thu_tu),
    }));

    res.json({ success: true, data: tree });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/tieu-chi/flat — Lấy danh sách phẳng (cho dropdown)
exports.getFlat = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tieu_chi')
      .select('*')
      .eq('is_active', true)
      .order('thu_tu');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/tieu-chi/:id
exports.getById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tieu_chi')
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

// POST /api/tieu-chi — Tạo tiêu chí (cha hoặc con)
exports.create = async (req, res) => {
  try {
    const { ten_tieu_chi, mo_ta, thu_tu, parent_id } = req.body;
    const { data, error } = await supabase
      .from('tieu_chi')
      .insert([{ ten_tieu_chi, mo_ta, thu_tu: thu_tu || 1, parent_id: parent_id || null, is_active: true }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/tieu-chi/:id
exports.update = async (req, res) => {
  try {
    const { ten_tieu_chi, mo_ta, thu_tu, parent_id } = req.body;
    const updateData = {};
    if (ten_tieu_chi !== undefined) updateData.ten_tieu_chi = ten_tieu_chi;
    if (mo_ta !== undefined) updateData.mo_ta = mo_ta;
    if (thu_tu !== undefined) updateData.thu_tu = thu_tu;
    if (parent_id !== undefined) updateData.parent_id = parent_id;

    const { data, error } = await supabase
      .from('tieu_chi')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/tieu-chi/:id (soft delete)
exports.remove = async (req, res) => {
  try {
    const { error } = await supabase
      .from('tieu_chi')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Đã vô hiệu hóa tiêu chí' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
