const supabase = require('../config/db');

// GET /api/tieu-chi
exports.getAll = async (req, res) => {
  try {
    const { loai_doi_tuong } = req.query;
    let query = supabase
      .from('tieu_chi')
      .select('*')
      .eq('is_active', true)
      .order('thu_tu');

    if (loai_doi_tuong) {
      query = query.in('loai_doi_tuong', [loai_doi_tuong, 'both']);
    }

    const { data, error } = await query;
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

// POST /api/tieu-chi
exports.create = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tieu_chi')
      .insert([req.body])
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
    const { data, error } = await supabase
      .from('tieu_chi')
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
