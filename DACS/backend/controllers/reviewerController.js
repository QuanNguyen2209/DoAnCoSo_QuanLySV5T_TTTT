const supabase = require('../config/db');

// ──────────────────────────────────────────────────
// GET /api/reviewer/applications
// Lấy danh sách hồ sơ thuộc các lớp mà cán bộ được phân công
// ──────────────────────────────────────────────────
exports.getAssignedApplications = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { trang_thai, search, lop_id } = req.query;

    // 1. Lấy danh sách lớp được phân công
    const { data: assignments, error: assignErr } = await supabase
      .from('reviewer_assignments')
      .select('lop_id')
      .eq('reviewer_id', reviewerId);

    if (assignErr) throw assignErr;

    if (!assignments || assignments.length === 0) {
      return res.json({ success: true, data: [], message: 'Bạn chưa được phân công quản lý lớp nào.' });
    }

    const lopIds = assignments.map(a => a.lop_id);

    // 2. Lấy danh sách sinh viên thuộc các lớp đó
    let studentQuery = supabase
      .from('users')
      .select('id');

    if (lop_id && lop_id !== 'all') {
      // Bảo mật: Kiểm tra xem lop_id có nằm trong danh sách được phân công không
      if (!lopIds.includes(parseInt(lop_id))) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền quản lý lớp này.' });
      }
      studentQuery = studentQuery.eq('lop_id', lop_id);
    } else {
      studentQuery = studentQuery.in('lop_id', lopIds);
    }

    const { data: students, error: stuErr } = await studentQuery;

    if (stuErr) throw stuErr;

    if (!students || students.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const studentIds = students.map(s => s.id);

    // 3. Lấy hồ sơ của các sinh viên đó
    let query = supabase
      .from('ho_so')
      .select(`
        *,
        users!ho_so_sinh_vien_id_fkey ( id, ho_ten, ma_sv, email, lop_id,
          lop_hoc ( id, ma_lop, ten_lop, khoa ( id, ten_khoa ) )
        ),
        ky_xet_duyet ( id, ten_ky, nam_hoc, trang_thai ),
        minh_chung ( id, ten_thanh_tich, tieu_chi_id )
      `)
      .in('sinh_vien_id', studentIds)
      .order('created_at', { ascending: false });

    // Filter theo trạng thái
    if (trang_thai && trang_thai !== 'all') {
      query = query.eq('trang_thai', trang_thai);
    } else {
      // Mặc định chỉ lấy hồ sơ đã nộp (không lấy draft)
      query = query.neq('trang_thai', 'draft');
    }

    const { data, error } = await query;
    if (error) throw error;

    // 4. Nếu có search, filter phía server
    let filtered = data || [];
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(h =>
        h.users?.ho_ten?.toLowerCase().includes(s) ||
        h.users?.ma_sv?.toLowerCase().includes(s) ||
        h.ma_ho_so?.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, data: filtered });
  } catch (err) {
    console.error('Lỗi getAssignedApplications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// GET /api/reviewer/applications/:id
// Xem chi tiết 1 hồ sơ (kèm E-Profile sinh viên + minh chứng)
// ──────────────────────────────────────────────────
exports.getApplicationDetail = async (req, res) => {
  try {
    const hoSoId = req.params.id;

    // 1. Lấy hồ sơ chi tiết
    const { data: hoSo, error: hsErr } = await supabase
      .from('ho_so')
      .select(`
        *,
        users!ho_so_sinh_vien_id_fkey ( id, ho_ten, ma_sv, email, avatar_url, lop_id,
          lop_hoc ( id, ma_lop, ten_lop, khoa ( id, ten_khoa ) )
        ),
        ky_xet_duyet ( * ),
        minh_chung (
          *,
          tieu_chi ( id, ten_tieu_chi, mo_ta ),
          minh_chung_files ( * )
        ),
        lich_su_ho_so (
          *,
          users ( id, ho_ten, role )
        )
      `)
      .eq('id', hoSoId)
      .single();

    if (hsErr) throw hsErr;
    if (!hoSo) return res.status(404).json({ success: false, error: 'Hồ sơ không tồn tại' });

    // 2. Lấy E-Profile sinh viên
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', hoSo.sinh_vien_id)
      .maybeSingle();

    res.json({
      success: true,
      data: {
        ...hoSo,
        user_profile: profile || {}
      }
    });
  } catch (err) {
    console.error('Lỗi getApplicationDetail:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// PUT /api/reviewer/applications/:id/review
// Duyệt hoặc từ chối hồ sơ
// Body: { action: 'approved' | 'rejected', phan_hoi_duyet: '...' }
// ──────────────────────────────────────────────────
exports.reviewApplication = async (req, res) => {
  try {
    const hoSoId = req.params.id;
    const reviewerId = req.user.id;
    const { action, phan_hoi_duyet } = req.body;

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Action phải là approved hoặc rejected' });
    }

    // 1. Kiểm tra hồ sơ tồn tại và đang ở trạng thái có thể duyệt
    const { data: existing, error: fetchErr } = await supabase
      .from('ho_so')
      .select('id, trang_thai, sinh_vien_id')
      .eq('id', hoSoId)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, error: 'Hồ sơ không tồn tại' });
    }
    if (!['pending', 'reviewing'].includes(existing.trang_thai)) {
      return res.status(400).json({ success: false, error: 'Hồ sơ này không ở trạng thái có thể duyệt' });
    }

    // 2. Cập nhật trạng thái
    const updateData = {
      trang_thai: action,
      phan_hoi_duyet: phan_hoi_duyet || null,
      nguoi_duyet_id: reviewerId,
      ngay_duyet: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('ho_so')
      .update(updateData)
      .eq('id', hoSoId)
      .select()
      .single();

    if (error) throw error;

    // 3. Ghi lịch sử
    await supabase.from('lich_su_ho_so').insert([{
      ho_so_id: hoSoId,
      tu_trang_thai: existing.trang_thai,
      den_trang_thai: action,
      ghi_chu: action === 'approved'
        ? `Cán bộ đã duyệt hồ sơ. ${phan_hoi_duyet || ''}`
        : `Cán bộ từ chối hồ sơ. Lý do: ${phan_hoi_duyet || 'Không rõ'}`,
      nguoi_thuc_hien_id: reviewerId,
    }]);

    const message = action === 'approved' ? 'Hồ sơ đã được phê duyệt!' : 'Hồ sơ đã bị từ chối.';
    res.json({ success: true, data, message });
  } catch (err) {
    console.error('Lỗi reviewApplication:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// GET /api/reviewer/stats
// Thống kê hồ sơ theo lớp được phân công
// ──────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const reviewerId = req.user.id;

    // 1. Lấy danh sách lớp được phân công
    const { data: assignments, error: assignErr } = await supabase
      .from('reviewer_assignments')
      .select('lop_id, lop_hoc ( id, ma_lop, ten_lop )')
      .eq('reviewer_id', reviewerId);

    if (assignErr) throw assignErr;
    if (!assignments || assignments.length === 0) {
      return res.json({ success: true, data: { classes: [], totals: { total: 0, pending: 0, approved: 0, rejected: 0 } } });
    }

    const lopIds = assignments.map(a => a.lop_id);

    // 2. Lấy sinh viên thuộc các lớp đó
    const { data: students } = await supabase
      .from('users')
      .select('id, lop_id')
      .in('lop_id', lopIds);

    const studentIds = (students || []).map(s => s.id);

    if (studentIds.length === 0) {
      return res.json({
        success: true,
        data: {
          classes: assignments.map(a => ({ ...a.lop_hoc, total: 0, pending: 0, approved: 0, rejected: 0 })),
          totals: { total: 0, pending: 0, approved: 0, rejected: 0 }
        }
      });
    }

    // 3. Lấy tất cả hồ sơ (trừ draft)
    const { data: allHoSo } = await supabase
      .from('ho_so')
      .select('id, trang_thai, sinh_vien_id')
      .in('sinh_vien_id', studentIds)
      .neq('trang_thai', 'draft');

    const hoSoList = allHoSo || [];

    // 4. Tính tổng
    const totals = {
      total: hoSoList.length,
      pending: hoSoList.filter(h => h.trang_thai === 'pending').length,
      reviewing: hoSoList.filter(h => h.trang_thai === 'reviewing').length,
      approved: hoSoList.filter(h => h.trang_thai === 'approved').length,
      rejected: hoSoList.filter(h => h.trang_thai === 'rejected').length,
    };

    // 5. Tính theo từng lớp
    const classStats = assignments.map(a => {
      const classStudentIds = (students || []).filter(s => s.lop_id === a.lop_id).map(s => s.id);
      const classHoSo = hoSoList.filter(h => classStudentIds.includes(h.sinh_vien_id));
      return {
        id: a.lop_hoc?.id,
        ma_lop: a.lop_hoc?.ma_lop,
        ten_lop: a.lop_hoc?.ten_lop,
        total: classHoSo.length,
        pending: classHoSo.filter(h => h.trang_thai === 'pending').length,
        approved: classHoSo.filter(h => h.trang_thai === 'approved').length,
        rejected: classHoSo.filter(h => h.trang_thai === 'rejected').length,
      };
    });

    res.json({ success: true, data: { classes: classStats, totals } });
  } catch (err) {
    console.error('Lỗi getStats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// GET /api/reviewer/assigned-classes
// Lấy danh sách lớp được phân công
// ──────────────────────────────────────────────────
exports.getAssignedClasses = async (req, res) => {
  try {
    const reviewerId = req.user.id;
    const { data, error } = await supabase
      .from('reviewer_assignments')
      .select('lop_id, lop_hoc ( id, ma_lop, ten_lop, khoa ( id, ten_khoa ) )')
      .eq('reviewer_id', reviewerId);

    if (error) throw error;
    res.json({ success: true, data: (data || []).map(a => a.lop_hoc) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// ──────────────────────────────────────────────────
// ADMIN: Lấy tất cả phân công (Dành cho trang quản lý Admin)
// ──────────────────────────────────────────────────
exports.getAllAssignments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviewer_assignments')
      .select(`
        id,
        reviewer_id,
        lop_id,
        users!reviewer_id ( id, ho_ten, email, ma_sv ),
        lop_hoc!lop_id ( id, ma_lop, ten_lop, khoa ( id, ten_khoa ) )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// ADMIN: Tạo phân công mới
// ──────────────────────────────────────────────────
exports.createAssignment = async (req, res) => {
  try {
    const { reviewer_id, lop_id } = req.body;
    
    // Kiểm tra xem đã tồn tại phân công này chưa
    const { data: existing } = await supabase
      .from('reviewer_assignments')
      .select('id')
      .eq('reviewer_id', reviewer_id)
      .eq('lop_id', lop_id)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, error: 'Phân công này đã tồn tại.' });
    }

    const { data, error } = await supabase
      .from('reviewer_assignments')
      .insert([{ reviewer_id, lop_id }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// ADMIN: Xóa phân công
// ──────────────────────────────────────────────────
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('reviewer_assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa phân công.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// ADMIN: Lấy danh sách tất cả cán bộ
// ──────────────────────────────────────────────────
exports.getAllReviewers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, ho_ten, email, ma_sv, role')
      .eq('role', 'can_bo')
      .eq('is_active', true)
      .order('ho_ten');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
