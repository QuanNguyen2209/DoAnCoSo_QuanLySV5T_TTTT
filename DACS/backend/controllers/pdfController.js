const supabase = require('../config/db');
const pdfService = require('../services/pdfService');
const { handleError, requireId } = require('../utils/http');
const { assertCanViewStudentData } = require('../utils/access');
const { attachEventLinks } = require('../utils/eventEvidence');

// ──────────────────────────────────────────────────
// GET /api/pdf/ho-so/:id
// Xuất PDF "Bản Giới Thiệu Thành Tích" cho 1 hồ sơ
// ──────────────────────────────────────────────────
exports.exportHoSo = async (req, res) => {
  try {
    const hoSoId = requireId(req.params.id, 'Mã hồ sơ');

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

    // 2. Kiểm tra quyền: chính chủ, admin, hoặc cán bộ được phân công lớp của SV
    //    (trước đây chỉ chặn role 'sinh_vien' → lớp trưởng xuất được PDF hồ sơ của bất kỳ ai)
    await assertCanViewStudentData(req.user, hoSo.sinh_vien_id);
    await attachEventLinks(hoSo.minh_chung);

    // 3 + 4. Lấy E-Profile và cây tiêu chí song song; lọc theo loại đối tượng ngay trong truy vấn
    const loai = hoSo.loai_doi_tuong; // 'individual' hoặc 'collective'
    const [{ data: profile }, { data: filtered, error: tcErr }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', hoSo.sinh_vien_id).maybeSingle(),
      supabase.from('tieu_chi').select('*').eq('is_active', true).in('loai_doi_tuong', [loai, 'both']).order('thu_tu'),
    ]);
    if (tcErr) throw tcErr;

    // Build tree (cha-con) bằng Map: O(n)
    const childrenByParent = new Map();
    for (const tc of filtered || []) {
      if (!tc.parent_id) continue;
      if (!childrenByParent.has(tc.parent_id)) childrenByParent.set(tc.parent_id, []);
      childrenByParent.get(tc.parent_id).push(tc);
    }
    const criteriaTree = (filtered || [])
      .filter(tc => !tc.parent_id)
      .map(p => ({
        ...p,
        children: (childrenByParent.get(p.id) || []).sort((a, b) => (a.thu_tu || 0) - (b.thu_tu || 0)),
      }));

    // 5. Tạo PDF
    const doc = pdfService.createDocument();

    // Set response headers
    const fileName = `BanGioiThieu_${String(hoSo.ma_ho_so || 'HoSo').replace(/[^\w.-]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.on('error', (e) => { console.error('Lỗi stream PDF:', e); res.end(); });

    // Pipe PDF stream to response
    doc.pipe(res);

    // Render các phần
    const namHoc = hoSo.ky_xet_duyet?.nam_hoc || new Date().getFullYear().toString();
    pdfService.addHeader(doc, namHoc, hoSo.ky_xet_duyet);
    pdfService.addLyLichTrichNgang(doc, hoSo.users, profile);
    pdfService.addThanhTichTieuBieu(doc, criteriaTree, hoSo.minh_chung || [], namHoc);

    // Thêm số trang
    pdfService.addPageNumbers(doc);

    // Kết thúc
    doc.end();

  } catch (err) {
    // Nếu đã bắt đầu stream thì không thể gửi JSON error
    if (res.headersSent) {
      console.error('Lỗi exportHoSo PDF:', err);
      return res.end();
    }
    handleError(res, err, 'exportHoSo PDF');
  }
};
