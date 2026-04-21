const supabase = require('../config/db');

// GET /api/minh-chung?ho_so_id=x
exports.getByHoSo = async (req, res) => {
  try {
    const { ho_so_id } = req.query;
    if (!ho_so_id) return res.status(400).json({ success: false, error: 'Thiếu ho_so_id' });

    const { data, error } = await supabase
      .from('minh_chung')
      .select('*, tieu_chi(id, ten_tieu_chi), minh_chung_files(*)')
      .eq('ho_so_id', ho_so_id)
      .order('created_at');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/minh-chung — Thêm minh chứng (chỉ text, không bắt buộc file)
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
      .select('*, tieu_chi(id, ten_tieu_chi), minh_chung_files(*)')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/minh-chung/:id — Cập nhật thông tin text minh chứng
exports.update = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('minh_chung')
      .update(req.body)
      .eq('id', req.params.id)
      .select('*, minh_chung_files(*)')
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

// ──────────────────────────────────────────────────
// MULTI-FILE ENDPOINTS (bảng minh_chung_files)
// ──────────────────────────────────────────────────

// POST /api/minh-chung/:id/files — Thêm file vào minh chứng (tối đa 4)
exports.addFile = async (req, res) => {
  try {
    const minhChungId = req.params.id;
    const { file_url, file_name, file_size, file_type } = req.body;

    // Kiểm tra số file hiện tại
    const { data: existing, error: countErr } = await supabase
      .from('minh_chung_files')
      .select('id')
      .eq('minh_chung_id', minhChungId);

    if (countErr) throw countErr;
    if ((existing || []).length >= 4) {
      return res.status(400).json({ success: false, error: 'Mỗi minh chứng chỉ được tối đa 4 file' });
    }

    const { data, error } = await supabase
      .from('minh_chung_files')
      .insert([{ minh_chung_id: minhChungId, file_url, file_name, file_size, file_type }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/minh-chung/files/:fileId — Xóa 1 file
exports.removeFile = async (req, res) => {
  try {
    const { error } = await supabase
      .from('minh_chung_files')
      .delete()
      .eq('id', req.params.fileId);

    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa file' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/minh-chung/upsert-for-criteria — Tạo hoặc cập nhật minh chứng cho 1 tiêu chí
exports.upsertForCriteria = async (req, res) => {
  try {
    const { ho_so_id, tieu_chi_id, mo_ta } = req.body;

    // Kiểm tra đã có minh chứng cho tiêu chí này chưa
    const { data: existing } = await supabase
      .from('minh_chung')
      .select('id')
      .eq('ho_so_id', ho_so_id)
      .eq('tieu_chi_id', tieu_chi_id)
      .maybeSingle();

    let result;
    if (existing) {
      // Update
      const { data, error } = await supabase
        .from('minh_chung')
        .update({ mo_ta })
        .eq('id', existing.id)
        .select('*, minh_chung_files(*)')
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Insert
      const { data, error } = await supabase
        .from('minh_chung')
        .insert([{
          ho_so_id,
          tieu_chi_id,
          ten_thanh_tich: 'Minh chứng tiêu chí',
          mo_ta,
        }])
        .select('*, minh_chung_files(*)')
        .single();
      if (error) throw error;
      result = data;
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
