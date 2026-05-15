const supabase = require('../config/db');

// Helper: tạo mã hồ sơ tự động
async function generateMaHoSo() {
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('ho_so')
    .select('*', { count: 'exact', head: true });
  const seq = String((count || 0) + 1).padStart(3, '0');
  return `HS-${year}-${seq}`;
}

// GET /api/ho-so — Lấy danh sách (filter theo sinh_vien_id)
exports.getAll = async (req, res) => {
  try {
    const { sinh_vien_id, trang_thai } = req.query;

    let query = supabase
      .from('ho_so')
      .select(`
        *,
        ky_xet_duyet ( id, ten_ky, nam_hoc, trang_thai ),
        minh_chung ( id, ten_thanh_tich, tieu_chi_id )
      `)
      .order('created_at', { ascending: false });

    if (sinh_vien_id) query = query.eq('sinh_vien_id', sinh_vien_id);
    if (trang_thai)   query = query.eq('trang_thai', trang_thai);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/ho-so/:id
exports.getById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ho_so')
      .select(`
        *,
        ky_xet_duyet ( * ),
        minh_chung (
          *,
          tieu_chi ( id, ten_tieu_chi ),
          minh_chung_files ( * )
        ),
        lich_su_ho_so (
          *,
          users ( id, ho_ten, role )
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Hồ sơ không tồn tại' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/ho-so — Tạo hồ sơ mới (bản nháp)
exports.create = async (req, res) => {
  try {
    const { sinh_vien_id, ky_xet_duyet_id, loai_doi_tuong, ghi_chu_sv, cap_xet_duyet } = req.body;

    const ma_ho_so = await generateMaHoSo();

    const { data, error } = await supabase
      .from('ho_so')
      .insert([{
        ma_ho_so,
        sinh_vien_id,
        ky_xet_duyet_id,
        loai_doi_tuong,
        ghi_chu_sv,
        cap_xet_duyet: cap_xet_duyet || 'khoa',
        trang_thai: 'draft',
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/ho-so/:id — Cập nhật thông tin
exports.update = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ho_so')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/ho-so/:id/submit — Nộp hồ sơ (draft → pending)
exports.submit = async (req, res) => {
  try {
    // Kiểm tra hồ sơ tồn tại và còn ở trạng thái draft
    const { data: existing, error: fetchErr } = await supabase
      .from('ho_so')
      .select('id, trang_thai, minh_chung(id)')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: 'Hồ sơ không tồn tại' });
    }
    if (existing.trang_thai !== 'draft' && existing.trang_thai !== 'rejected') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể nộp hồ sơ đang ở trạng thái bản nháp hoặc cần bổ sung' });
    }
    if (!existing.minh_chung || existing.minh_chung.length === 0) {
      return res.status(400).json({ success: false, error: 'Vui lòng thêm ít nhất một minh chứng trước khi nộp' });
    }

    const { data, error } = await supabase
      .from('ho_so')
      .update({ trang_thai: 'pending', ngay_nop: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Ghi lịch sử
    await supabase.from('lich_su_ho_so').insert([{
      ho_so_id: req.params.id,
      tu_trang_thai: existing.trang_thai,
      den_trang_thai: 'pending',
      ghi_chu: 'Sinh viên nộp hồ sơ',
      nguoi_thuc_hien_id: req.body.sinh_vien_id || null,
    }]);

    res.json({ success: true, data, message: 'Hồ sơ đã được nộp thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/ho-so/:id — Xóa (chỉ khi draft)
exports.remove = async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('ho_so')
      .select('trang_thai')
      .eq('id', req.params.id)
      .single();

    if (!existing) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    if (existing.trang_thai !== 'draft') {
      return res.status(400).json({ success: false, error: 'Chỉ có thể xóa hồ sơ bản nháp' });
    }

    const { error } = await supabase.from('ho_so').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa hồ sơ' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/ho-so/stats/:sinh_vien_id — Thống kê hồ sơ của sinh viên
exports.getStats = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ho_so')
      .select('trang_thai')
      .eq('sinh_vien_id', req.params.sinh_vien_id);

    if (error) throw error;

    const stats = {
      total: data.length,
      draft: data.filter(h => h.trang_thai === 'draft').length,
      pending: data.filter(h => h.trang_thai === 'pending').length,
      approved: data.filter(h => h.trang_thai === 'approved').length,
      rejected: data.filter(h => h.trang_thai === 'rejected').length,
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
