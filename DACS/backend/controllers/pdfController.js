const supabase = require('../config/db');
const pdfService = require('../services/pdfService');

// ──────────────────────────────────────────────────
// GET /api/pdf/ho-so/:id
// Xuất PDF "Bản Giới Thiệu Thành Tích" cho 1 hồ sơ
// ──────────────────────────────────────────────────
exports.exportHoSo = async (req, res) => {
  try {
    const hoSoId = req.params.id;

    // 1. Lấy hồ sơ đầy đủ
    const { data: hoSo, error: hsErr } = await supabase
      .from('ho_so')
      .select(`
        *,
        users!ho_so_sinh_vien_id_fkey (
          id, ho_ten, ma_sv, email, avatar_url, lop_id,
          lop_hoc ( id, ma_lop, ten_lop, khoa ( id, ten_khoa ) )
        ),
        ky_xet_duyet ( * ),
        minh_chung (
          *,
          tieu_chi ( id, ten_tieu_chi, mo_ta, parent_id, thu_tu ),
          minh_chung_files ( * )
        )
      `)
      .eq('id', hoSoId)
      .single();

    if (hsErr) {
      // PGRST116 = no rows returned for .single()
      if (hsErr.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Hồ sơ không tồn tại' });
      }
      throw hsErr;
    }
    if (!hoSo) {
      return res.status(404).json({ success: false, error: 'Hồ sơ không tồn tại' });
    }

    // 2. Kiểm tra quyền: sinh viên chỉ xem hồ sơ của mình, cán bộ/admin xem tất cả
    const userId = req.user.id;
    const userRole = req.user.role;
    if (userRole === 'sinh_vien' && hoSo.sinh_vien_id !== userId) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền xem hồ sơ này' });
    }

    // 3. Lấy E-Profile sinh viên
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', hoSo.sinh_vien_id)
      .maybeSingle();

    // 4. Lấy cây tiêu chí (theo loại đối tượng)
    const { data: allCriteria } = await supabase
      .from('tieu_chi')
      .select('*')
      .eq('is_active', true)
      .order('thu_tu');

    // Lọc theo loại đối tượng
    const loai = hoSo.loai_doi_tuong; // 'individual' hoặc 'collective'
    const filtered = (allCriteria || []).filter(tc =>
      tc.loai_doi_tuong === loai || tc.loai_doi_tuong === 'both'
    );

    // Build tree (cha-con)
    const parents = filtered.filter(tc => !tc.parent_id);
    const criteriaTree = parents.map(p => ({
      ...p,
      children: filtered
        .filter(c => c.parent_id === p.id)
        .sort((a, b) => (a.thu_tu || 0) - (b.thu_tu || 0)),
    }));

    // 5. Tạo PDF
    const doc = pdfService.createDocument();

    // Set response headers
    const fileName = `BanGioiThieu_${hoSo.ma_ho_so || 'HoSo'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Pipe PDF stream to response
    doc.pipe(res);

    // Render các phần
    const namHoc = hoSo.ky_xet_duyet?.nam_hoc || new Date().getFullYear().toString();
    pdfService.addHeader(doc, namHoc, hoSo.ky_xet_duyet);
    pdfService.addLyLichTrichNgang(doc, hoSo.users, profile);
    pdfService.addThanhTichTieuBieu(doc, criteriaTree, hoSo.minh_chung || []);

    // Thêm số trang
    pdfService.addPageNumbers(doc);

    // Kết thúc
    doc.end();

  } catch (err) {
    console.error('Lỗi exportHoSo PDF:', err);
    // Nếu đã bắt đầu stream thì không thể gửi JSON error
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
