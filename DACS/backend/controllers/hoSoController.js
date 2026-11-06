const supabase = require('../config/db');
const { HttpError, handleError, pick, requireId, toId } = require('../utils/http');
const { isAdmin, loadOwnHoSo, assertCanViewStudentData } = require('../utils/access');
const { periodStatus } = require('../utils/period');
const { attachEventLinks } = require('../utils/eventEvidence');

const VALID_LOAI = ['individual', 'collective'];
const VALID_CAP = ['khoa', 'truong'];
const STORAGE_BUCKET = 'minh-chung';

// ── Helpers ─────────────────────────────────────────────────────

// Sinh mã hồ sơ dạng HS-<năm>-<số thứ tự>.
// Cách cũ dùng COUNT(*)+1 → bị TRÙNG mã sau khi xoá 1 hồ sơ (ma_ho_so là UNIQUE) → không tạo được hồ sơ mới.
// Cách mới: lấy số thứ tự lớn nhất của năm hiện tại rồi +1, có retry nếu đụng độ.
async function nextMaHoSoSeq(prefix) {
  const { data, error } = await supabase
    .from('ho_so')
    .select('ma_ho_so')
    .like('ma_ho_so', `${prefix}%`)
    .order('id', { ascending: false })
    .limit(20);
  if (error) throw error;

  const maxSeq = (data || []).reduce((max, row) => {
    const n = parseInt(String(row.ma_ho_so).slice(prefix.length), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return maxSeq + 1;
}

// Xoá toàn bộ file minh chứng của 1 hồ sơ trên Storage (best-effort, không chặn luồng chính)
async function removeHoSoStorageFolder(hoSoId) {
  try {
    const folder = `ho-so/${hoSoId}`;
    const { data: files } = await supabase.storage.from(STORAGE_BUCKET).list(folder, { limit: 1000 });
    if (files && files.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(files.map((f) => `${folder}/${f.name}`));
    }
  } catch (e) {
    console.warn('Không xoá được file storage của hồ sơ', hoSoId, e.message);
  }
}

// ── GET /api/ho-so — Danh sách hồ sơ ───────────────────────────
// Sinh viên chỉ thấy hồ sơ của mình; admin xem tất cả (có thể lọc).
exports.getAll = async (req, res) => {
  try {
    const { trang_thai } = req.query;
    const sinhVienId = isAdmin(req.user) ? toId(req.query.sinh_vien_id) : req.user.id;

    let query = supabase
      .from('ho_so')
      .select(`
        *,
        ky_xet_duyet ( id, ten_ky, nam_hoc, trang_thai ),
        minh_chung ( id, ten_thanh_tich, tieu_chi_id )
      `)
      .order('created_at', { ascending: false });

    if (sinhVienId) query = query.eq('sinh_vien_id', sinhVienId);
    if (trang_thai) query = query.eq('trang_thai', trang_thai);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'hoSo.getAll');
  }
};

// ── GET /api/ho-so/:id ─────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const id = requireId(req.params.id, 'Mã hồ sơ');
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
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Hồ sơ không tồn tại' });

    await assertCanViewStudentData(req.user, data.sinh_vien_id);
    await attachEventLinks(data.minh_chung);

    // Sắp xếp lịch sử theo thời gian để hiển thị đúng thứ tự
    if (Array.isArray(data.lich_su_ho_so)) {
      data.lich_su_ho_so.sort((a, b) => new Date(a.thoi_gian || a.created_at) - new Date(b.thoi_gian || b.created_at));
    }
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'hoSo.getById');
  }
};

// ── POST /api/ho-so — Tạo hồ sơ mới (bản nháp) ─────────────────
exports.create = async (req, res) => {
  try {
    const user = req.user;
    const { loai_doi_tuong, ghi_chu_sv } = req.body;
    const cap_xet_duyet = req.body.cap_xet_duyet || 'khoa';

    // Không tin sinh_vien_id từ client: SV luôn tạo hồ sơ cho chính mình
    const sinhVienId = isAdmin(user) && toId(req.body.sinh_vien_id) ? toId(req.body.sinh_vien_id) : user.id;
    const kyId = requireId(req.body.ky_xet_duyet_id, 'Kỳ xét duyệt');

    if (!VALID_LOAI.includes(loai_doi_tuong)) {
      throw new HttpError(400, 'Loại đối tượng không hợp lệ');
    }
    if (!VALID_CAP.includes(cap_xet_duyet)) {
      throw new HttpError(400, 'Cấp xét duyệt không hợp lệ (khoa | truong)');
    }
    if (loai_doi_tuong === 'collective' && !['lop_truong', 'admin'].includes(user.role)) {
      throw new HttpError(403, 'Chỉ Lớp trưởng mới được đăng ký danh hiệu Tập thể tiên tiến');
    }

    // Kiểm tra kỳ xét duyệt + hồ sơ trùng song song
    const [kyRes, existingRes] = await Promise.all([
      supabase.from('ky_xet_duyet').select('id, trang_thai, ngay_bat_dau, ngay_ket_thuc').eq('id', kyId).maybeSingle(),
      supabase
        .from('ho_so')
        .select('id, trang_thai')
        .eq('sinh_vien_id', sinhVienId)
        .eq('ky_xet_duyet_id', kyId)
        .eq('loai_doi_tuong', loai_doi_tuong)
        .limit(1),
    ]);
    if (kyRes.error) throw kyRes.error;
    if (existingRes.error) throw existingRes.error;

    if (!kyRes.data) throw new HttpError(404, 'Kỳ xét duyệt không tồn tại');
    const period = periodStatus(kyRes.data);
    if (!period.open) throw new HttpError(400, period.reason);

    const existingApp = existingRes.data && existingRes.data[0];
    if (existingApp) {
      return res.status(400).json({
        success: false,
        error: existingApp.trang_thai === 'draft'
          ? 'Bạn đã có một bản nháp cho danh hiệu này trong đợt này. Vui lòng cập nhật bản nháp đã có.'
          : 'Bạn đã có hồ sơ cho danh hiệu này trong đợt này.',
        existingId: existingApp.id,
      });
    }

    const prefix = `HS-${new Date().getFullYear()}-`;
    let seq = await nextMaHoSoSeq(prefix);

    for (let attempt = 0; attempt < 5; attempt++) {
      const ma_ho_so = `${prefix}${String(seq).padStart(3, '0')}`;
      const { data, error } = await supabase
        .from('ho_so')
        .insert([{
          ma_ho_so,
          sinh_vien_id: sinhVienId,
          ky_xet_duyet_id: kyId,
          loai_doi_tuong,
          ghi_chu_sv: ghi_chu_sv || null,
          cap_xet_duyet,
          trang_thai: 'draft',
        }])
        .select()
        .single();

      if (!error) return res.status(201).json({ success: true, data });

      if (error.code === '23505') {
        if (String(error.message).includes('ma_ho_so')) { seq += 1; continue; } // đụng mã → thử số kế tiếp
        // Đụng unique (sinh_vien_id, ky_xet_duyet_id, loai_doi_tuong) do bấm 2 lần cùng lúc
        throw new HttpError(400, 'Bạn đã có hồ sơ cho danh hiệu này trong đợt này.');
      }
      throw error;
    }
    throw new HttpError(503, 'Không sinh được mã hồ sơ, vui lòng thử lại');
  } catch (err) {
    handleError(res, err, 'hoSo.create');
  }
};

// ── PUT /api/ho-so/:id — Cập nhật thông tin (chỉ chủ hồ sơ, khi còn sửa được) ─
exports.update = async (req, res) => {
  try {
    const hoSo = await loadOwnHoSo(req.params.id, req.user, { editable: true });

    // Chỉ cho sửa các field an toàn (trước đây ...req.body cho phép SV tự set trang_thai='approved')
    const payload = pick(req.body, ['ghi_chu_sv', 'cap_xet_duyet']);
    if (payload.cap_xet_duyet !== undefined && !VALID_CAP.includes(payload.cap_xet_duyet)) {
      throw new HttpError(400, 'Cấp xét duyệt không hợp lệ (khoa | truong)');
    }
    if (Object.keys(payload).length === 0) {
      throw new HttpError(400, 'Không có dữ liệu cần cập nhật');
    }

    const { data, error } = await supabase
      .from('ho_so')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', hoSo.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'hoSo.update');
  }
};

// ── POST /api/ho-so/:id/submit — Nộp hồ sơ (draft/rejected → pending) ─
exports.submit = async (req, res) => {
  try {
    const hoSo = await loadOwnHoSo(req.params.id, req.user, {
      editable: true,
      select: `
        id, sinh_vien_id, trang_thai, loai_doi_tuong, ky_xet_duyet_id,
        ky_xet_duyet ( trang_thai, ngay_bat_dau, ngay_ket_thuc ),
        minh_chung ( id, tieu_chi_id, mo_ta, minh_chung_files ( id ) )
      `,
    });

    // Nộp lần đầu phải trong hạn; nộp lại theo yêu cầu bổ sung chỉ cần kỳ còn mở
    const period = periodStatus(hoSo.ky_xet_duyet, { ignoreDates: hoSo.trang_thai === 'rejected' });
    if (!period.open) throw new HttpError(400, period.reason);

    const minhChung = hoSo.minh_chung || [];
    await attachEventLinks(minhChung);
    // Sự kiện đã điểm danh được tính như 1 minh chứng đính kèm (đã được hệ thống xác thực)
    const hasEvidence = (mc) => (mc.minh_chung_files || []).length > 0 || (mc.su_kien || []).length > 0;
    const hasContent = minhChung.some((mc) => (mc.mo_ta && mc.mo_ta.trim()) || hasEvidence(mc));
    if (!hasContent) {
      throw new HttpError(400, 'Vui lòng thêm ít nhất một minh chứng trước khi nộp');
    }

    // Kiểm tra tiêu chí BẮT BUỘC ở server (trước đây chỉ kiểm tra ở frontend → gọi API trực tiếp là bỏ qua được)
    const { data: required, error: tcErr } = await supabase
      .from('tieu_chi')
      .select('id, ten_tieu_chi, loai_doi_tuong')
      .eq('is_active', true)
      .eq('bat_buoc', true)
      .not('parent_id', 'is', null)
      .in('loai_doi_tuong', [hoSo.loai_doi_tuong, 'both']);
    if (tcErr) throw tcErr;

    const mcByTieuChi = new Map(minhChung.map((mc) => [mc.tieu_chi_id, mc]));
    const missing = (required || [])
      .map((tc) => {
        const mc = mcByTieuChi.get(tc.id);
        const missingDesc = !(mc && mc.mo_ta && mc.mo_ta.trim());
        const missingFile = !(mc && hasEvidence(mc));
        return missingDesc || missingFile
          ? { tieu_chi_id: tc.id, ten_tieu_chi: tc.ten_tieu_chi, missingDesc, missingFile }
          : null;
      })
      .filter(Boolean);

    if (missing.length > 0) {
      throw new HttpError(400, `Còn ${missing.length} tiêu chí bắt buộc chưa đủ mô tả/minh chứng`, { missing });
    }

    // Cập nhật có điều kiện theo trạng thái cũ → tránh nộp trùng khi bấm nhiều lần
    const { data, error } = await supabase
      .from('ho_so')
      .update({
        trang_thai: 'pending',
        ngay_nop: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Nộp lại: xoá kết quả duyệt cũ (nội dung vẫn còn trong lịch sử hồ sơ)
        ...(hoSo.trang_thai === 'rejected' && { phan_hoi_duyet: null, nguoi_duyet_id: null, ngay_duyet: null }),
      })
      .eq('id', hoSo.id)
      .eq('trang_thai', hoSo.trang_thai)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new HttpError(409, 'Trạng thái hồ sơ vừa thay đổi, vui lòng tải lại trang');

    // Nộp lại: bỏ đánh dấu "cần bổ sung" (giữ nhận xét để cán bộ đối chiếu)
    if (hoSo.trang_thai === 'rejected') {
      const { error: flagErr } = await supabase.from('minh_chung').update({ can_bo_sung: false }).eq('ho_so_id', hoSo.id);
      if (flagErr && !['42703', 'PGRST204'].includes(flagErr.code)) console.warn('Không xoá được cờ cần bổ sung:', flagErr.message);
    }

    const { error: histErr } = await supabase.from('lich_su_ho_so').insert([{
      ho_so_id: hoSo.id,
      tu_trang_thai: hoSo.trang_thai,
      den_trang_thai: 'pending',
      ghi_chu: hoSo.trang_thai === 'rejected' ? 'Sinh viên nộp lại hồ sơ sau khi bổ sung' : 'Sinh viên nộp hồ sơ',
      nguoi_thuc_hien_id: req.user.id, // lấy từ token, không tin body
    }]);
    if (histErr) console.warn('Không ghi được lịch sử hồ sơ:', histErr.message);

    res.json({ success: true, data, message: 'Hồ sơ đã được nộp thành công!' });
  } catch (err) {
    handleError(res, err, 'hoSo.submit');
  }
};

// ── DELETE /api/ho-so/:id — Xóa (chỉ khi draft) ────────────────
exports.remove = async (req, res) => {
  try {
    const hoSo = await loadOwnHoSo(req.params.id, req.user);
    if (hoSo.trang_thai !== 'draft') {
      throw new HttpError(400, 'Chỉ có thể xóa hồ sơ bản nháp');
    }

    const { data, error } = await supabase
      .from('ho_so')
      .delete()
      .eq('id', hoSo.id)
      .eq('trang_thai', 'draft')
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new HttpError(409, 'Trạng thái hồ sơ vừa thay đổi, không thể xoá');
    }

    removeHoSoStorageFolder(hoSo.id); // dọn file rác trên Storage (không chờ)
    res.json({ success: true, message: 'Đã xóa hồ sơ' });
  } catch (err) {
    handleError(res, err, 'hoSo.remove');
  }
};

// ── GET /api/ho-so/stats/:sinh_vien_id — Thống kê hồ sơ của sinh viên ─
exports.getStats = async (req, res) => {
  try {
    const sinhVienId = requireId(req.params.sinh_vien_id, 'Mã sinh viên');
    if (sinhVienId !== req.user.id && !isAdmin(req.user)) {
      throw new HttpError(403, 'Bạn không có quyền xem thống kê này');
    }

    const { data, error } = await supabase
      .from('ho_so')
      .select('trang_thai')
      .eq('sinh_vien_id', sinhVienId);
    if (error) throw error;

    // Đếm 1 lượt thay vì filter 4 lần
    const stats = { total: 0, draft: 0, pending: 0, reviewing: 0, approved: 0, rejected: 0 };
    for (const h of data || []) {
      stats.total += 1;
      if (stats[h.trang_thai] !== undefined) stats[h.trang_thai] += 1;
    }
    res.json({ success: true, data: stats });
  } catch (err) {
    handleError(res, err, 'hoSo.getStats');
  }
};

