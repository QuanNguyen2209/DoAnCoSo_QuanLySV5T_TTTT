const supabase = require('../config/db');

// GET /api/minh-chung?ho_so_id=x
exports.getByHoSo = async (req, res) => {
  try {
    const { ho_so_id } = req.query;
    if (!ho_so_id) return res.status(400).json({ success: false, error: 'Thiếu ho_so_id' });

    const { data, error } = await supabase
      .from('minh_chung')
      .select('*, tieu_chi(id, ten_tieu_chi)')
      .eq('ho_so_id', ho_so_id)
      .order('created_at');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/minh-chung — Thêm minh chứng
exports.create = async (req, res) => {
  try {
    const { ho_so_id, tieu_chi_id, ten_thanh_tich, mo_ta, cap_thanh_tich, ngay_ghi_nhan, file_url, file_name, file_size, file_type } = req.body;

    const { data, error } = await supabase
      .from('minh_chung')
      .insert([{
        ho_so_id, tieu_chi_id, ten_thanh_tich, mo_ta,
        cap_thanh_tich, ngay_ghi_nhan,
        file_url, file_name, file_size, file_type,
      }])
      .select('*, tieu_chi(id, ten_tieu_chi)')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/minh-chung/:id
exports.update = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('minh_chung')
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

// DELETE /api/minh-chung/:id
exports.remove = async (req, res) => {
  try {
    const { error } = await supabase
      .from('minh_chung')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa minh chứng' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/minh-chung/upload-url — Lấy signed URL để upload file lên Supabase Storage
exports.getUploadUrl = async (req, res) => {
  try {
    const { file_name, file_type, ho_so_id } = req.body;
    if (!file_name || !ho_so_id) {
      return res.status(400).json({ success: false, error: 'Thiếu file_name hoặc ho_so_id' });
    }

    const ext = file_name.split('.').pop();
    const path = `ho-so/${ho_so_id}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('minh-chung')
      .createSignedUploadUrl(path);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        uploadUrl: data.signedUrl,
        path,
        publicUrl: supabase.storage.from('minh-chung').getPublicUrl(path).data.publicUrl,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
