const supabase = require('../config/db');
const { sendMail, isMailConfigured } = require('../services/mailService');
const { HttpError, handleError, requireId, toId, escapeHtml } = require('../utils/http');
const { isAdmin, getAssignedLopIds, isReviewerOfStudent } = require('../utils/access');
const { attachEventLinks, isMissingSchema } = require('../utils/eventEvidence');
const { ensureMinhChung } = require('../utils/minhChung');

// Gửi email kết quả xét duyệt cho SV (không chặn response; lỗi chỉ ghi log)
async function notifyReviewResult(sinhVienId, maHoSo, action, phanHoi, flagged = []) {
  if (!isMailConfigured()) return;
  try {
    const { data: sv } = await supabase.from('users').select('email, ho_ten').eq('id', sinhVienId).maybeSingle();
    if (!sv?.email) return;
    const approved = action === 'approved';
    await sendMail({
      to: sv.email,
      subject: `[Hệ thống SV5T] Hồ sơ ${maHoSo || ''} ${approved ? 'đã được phê duyệt' : 'cần bổ sung'}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: ${approved ? '#059669' : '#e11d48'};">
            ${approved ? '🎉 Hồ sơ của bạn đã được phê duyệt' : 'Hồ sơ của bạn cần bổ sung'}
          </h2>
          <p>Chào bạn <strong>${escapeHtml(sv.ho_ten || 'Sinh viên')}</strong>,</p>
          <p>Hồ sơ <strong>${escapeHtml(maHoSo || '')}</strong> vừa được cán bộ xét duyệt
             ${approved ? '<strong>phê duyệt</strong>.' : 'trả lại với yêu cầu bổ sung.'}</p>
          ${phanHoi ? `<div style="background:#f8fafc;border-left:4px solid #4f46e5;padding:12px 15px;margin:15px 0;border-radius:4px;">
            ${escapeHtml(phanHoi).replace(/\n/g, '<br/>')}</div>` : ''}
          ${flagged.length ? `<p><strong>Các tiêu chí cần bổ sung:</strong></p><ul>${flagged
              .map((f) => `<li><strong>${escapeHtml(f.ten)}</strong>${f.nhan_xet ? `: ${escapeHtml(f.nhan_xet)}` : ''}</li>`)
              .join('')}</ul>` : ''}
          ${approved ? '' : '<p>Vui lòng đăng nhập hệ thống, bổ sung minh chứng theo góp ý và <strong>nộp lại</strong> hồ sơ.</p>'}
          <p style="font-size: 12px; color: #64748b;">Đây là email tự động, vui lòng không phản hồi.</p>
        </div>`,
    });
  } catch (e) {
    console.warn('Không gửi được email kết quả xét duyệt:', e.message);
  }
}

const emptyCounts = () => ({ total: 0, pending: 0, reviewing: 0, approved: 0, rejected: 0 });

// Kiểm tra cán bộ có quyền xét duyệt hồ sơ của sinh viên này không (admin luôn được)
async function assertCanReview(user, sinhVienId) {
  if (isAdmin(user)) return;
  const ok = await isReviewerOfStudent(user.id, sinhVienId);
  if (!ok) throw new HttpError(403, 'Hồ sơ này không thuộc lớp bạn được phân công');
}

// Lấy id sinh viên thuộc các lớp
async function getStudentIdsByLops(lopIds) {
  if (!lopIds.length) return [];
  const { data, error } = await supabase.from('users').select('id, lop_id').in('lop_id', lopIds);
  if (error) throw error;
  return data || [];
}

// ──────────────────────────────────────────────────
// GET /api/reviewer/applications
// Danh sách hồ sơ thuộc các lớp mà cán bộ được phân công
// ──────────────────────────────────────────────────
exports.getAssignedApplications = async (req, res) => {
  try {
    const { trang_thai, search, lop_id } = req.query;
    const lopIds = await getAssignedLopIds(req.user.id);

    if (lopIds.length === 0) {
      return res.json({ success: true, data: [], message: 'Bạn chưa được phân công quản lý lớp nào.' });
    }

    let targetLops = lopIds;
    if (lop_id && lop_id !== 'all') {
      const lid = toId(lop_id);
      if (!lid || !lopIds.includes(lid)) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền quản lý lớp này.' });
      }
      targetLops = [lid];
    }

    const students = await getStudentIdsByLops(targetLops);
    if (students.length === 0) return res.json({ success: true, data: [] });

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
      .in('sinh_vien_id', students.map((s) => s.id))
      .order('created_at', { ascending: false });

    if (trang_thai && trang_thai !== 'all') {
      query = query.eq('trang_thai', trang_thai);
    } else {
      query = query.neq('trang_thai', 'draft'); // Mặc định không lấy bản nháp
    }
    // Bản nháp là dữ liệu riêng của SV → cán bộ không được xem kể cả khi lọc trang_thai=draft
    if (trang_thai === 'draft') return res.json({ success: true, data: [] });

    const { data, error } = await query;
    if (error) throw error;

    let filtered = data || [];
    if (search) {
      const s = String(search).toLowerCase();
      filtered = filtered.filter((h) =>
        h.users?.ho_ten?.toLowerCase().includes(s) ||
        h.users?.ma_sv?.toLowerCase().includes(s) ||
        h.ma_ho_so?.toLowerCase().includes(s)
      );
    }

    res.json({ success: true, data: filtered });
  } catch (err) {
    handleError(res, err, 'reviewer.getAssignedApplications');
  }
};

// ──────────────────────────────────────────────────
// GET /api/reviewer/applications/:id
// Chi tiết 1 hồ sơ (kèm E-Profile sinh viên + minh chứng)
// ──────────────────────────────────────────────────
exports.getApplicationDetail = async (req, res) => {
  try {
    const hoSoId = requireId(req.params.id, 'Mã hồ sơ');

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
      .maybeSingle();

    if (hsErr) throw hsErr;
    if (!hoSo) return res.status(404).json({ success: false, error: 'Hồ sơ không tồn tại' });

    // Quyền: chỉ cán bộ phụ trách lớp (hoặc admin); không xem bản nháp
    const [, profileRes] = await Promise.all([
      assertCanReview(req.user, hoSo.sinh_vien_id),
      supabase.from('user_profiles').select('*').eq('user_id', hoSo.sinh_vien_id).maybeSingle(),
    ]);
    if (hoSo.trang_thai === 'draft' && !isAdmin(req.user)) {
      throw new HttpError(403, 'Hồ sơ chưa được sinh viên nộp');
    }

    // Cán bộ mở hồ sơ đang chờ → chuyển sang "Đang xét duyệt" để SV biết hồ sơ đã được tiếp nhận
    if (hoSo.trang_thai === 'pending' && hoSo.sinh_vien_id !== req.user.id) {
      const { data: upd } = await supabase
        .from('ho_so')
        .update({ trang_thai: 'reviewing', updated_at: new Date().toISOString() })
        .eq('id', hoSo.id)
        .eq('trang_thai', 'pending')
        .select('id')
        .maybeSingle();
      if (upd) {
        hoSo.trang_thai = 'reviewing';
        const hist = {
          ho_so_id: hoSo.id,
          tu_trang_thai: 'pending',
          den_trang_thai: 'reviewing',
          ghi_chu: 'Cán bộ đã tiếp nhận và bắt đầu xét duyệt',
          nguoi_thuc_hien_id: req.user.id,
        };
        const { data: histRow } = await supabase.from('lich_su_ho_so').insert([hist]).select().maybeSingle();
        if (Array.isArray(hoSo.lich_su_ho_so)) {
          hoSo.lich_su_ho_so.push({ ...hist, ...(histRow || {}), users: { id: req.user.id, ho_ten: req.user.ho_ten, role: req.user.role } });
        }
      }
    }

    if (Array.isArray(hoSo.lich_su_ho_so)) {
      hoSo.lich_su_ho_so.sort((a, b) => new Date(a.thoi_gian || a.created_at) - new Date(b.thoi_gian || b.created_at));
    }
    await attachEventLinks(hoSo.minh_chung);

    res.json({ success: true, data: { ...hoSo, user_profile: profileRes.data || {} } });
  } catch (err) {
    handleError(res, err, 'reviewer.getApplicationDetail');
  }
};

// ──────────────────────────────────────────────────
// PUT /api/reviewer/applications/:id/review
// Body: { action: 'approved' | 'rejected', phan_hoi_duyet: '...' }
// ──────────────────────────────────────────────────
exports.reviewApplication = async (req, res) => {
  try {
    const hoSoId = requireId(req.params.id, 'Mã hồ sơ');
    const reviewerId = req.user.id;
    const { action } = req.body;
    const phanHoi = String(req.body.phan_hoi_duyet || '').trim();

    if (!['approved', 'rejected'].includes(action)) {
      throw new HttpError(400, 'Action phải là approved hoặc rejected');
    }
    // Góp ý theo từng tiêu chí: [{ tieu_chi_id, nhan_xet, can_bo_sung }]
    const feedbackItems = Array.isArray(req.body.nhan_xet_tieu_chi)
      ? req.body.nhan_xet_tieu_chi
          .map((i) => ({
            tieu_chi_id: toId(i?.tieu_chi_id),
            nhan_xet: String(i?.nhan_xet || '').trim().slice(0, 2000) || null,
            can_bo_sung: action === 'rejected' && !!i?.can_bo_sung, // duyệt đạt thì không còn mục "cần bổ sung"
          }))
          .filter((i) => i.tieu_chi_id)
      : null;
    const flaggedCount = (feedbackItems || []).filter((i) => i.can_bo_sung).length;

    if (action === 'rejected' && !phanHoi && flaggedCount === 0) {
      throw new HttpError(400, 'Vui lòng nhập lý do từ chối hoặc đánh dấu ít nhất 1 tiêu chí cần bổ sung');
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('ho_so')
      .select('id, trang_thai, sinh_vien_id, loai_doi_tuong')
      .eq('id', hoSoId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!existing) throw new HttpError(404, 'Hồ sơ không tồn tại');

    await assertCanReview(req.user, existing.sinh_vien_id);

    if (existing.sinh_vien_id === reviewerId) {
      throw new HttpError(403, 'Không thể tự xét duyệt hồ sơ của chính mình');
    }
    if (!['pending', 'reviewing'].includes(existing.trang_thai)) {
      throw new HttpError(400, 'Hồ sơ này không ở trạng thái có thể duyệt');
    }

    // Lưu góp ý theo tiêu chí (trước khi đổi trạng thái để lỗi CSDL không làm hồ sơ "nửa vời")
    const flagged = [];
    if (feedbackItems) {
      const useful = feedbackItems.filter((i) => i.nhan_xet || i.can_bo_sung);
      const { error: resetErr } = await supabase
        .from('minh_chung').update({ nhan_xet: null, can_bo_sung: false }).eq('ho_so_id', hoSoId);
      if (resetErr && !(isMissingSchema(resetErr) && useful.length === 0)) {
        // Chưa chạy migration nhưng không có góp ý nào → vẫn cho duyệt bình thường
        if (isMissingSchema(resetErr)) {
          throw new HttpError(503, 'Cần chạy database/add_event_evidence_and_feedback.sql để dùng góp ý theo từng tiêu chí');
        }
        throw resetErr;
      }

      if (useful.length && !resetErr) {
        const { data: tcs, error: tcErr } = await supabase
          .from('tieu_chi').select('id, ten_tieu_chi, loai_doi_tuong').in('id', useful.map((i) => i.tieu_chi_id));
        if (tcErr) throw tcErr;
        const tcMap = new Map((tcs || [])
          .filter((t) => !t.loai_doi_tuong || t.loai_doi_tuong === 'both' || t.loai_doi_tuong === existing.loai_doi_tuong)
          .map((t) => [t.id, t]));

        for (const item of useful) {
          const tc = tcMap.get(item.tieu_chi_id);
          if (!tc) continue; // bỏ qua tiêu chí không thuộc hồ sơ
          const { mc } = await ensureMinhChung(hoSoId, item.tieu_chi_id, 'id');
          const { error: upErr } = await supabase
            .from('minh_chung').update({ nhan_xet: item.nhan_xet, can_bo_sung: item.can_bo_sung }).eq('id', mc.id);
          if (upErr) throw upErr;
          if (item.can_bo_sung) flagged.push({ ten: tc.ten_tieu_chi, nhan_xet: item.nhan_xet });
        }
      }
    }

    const now = new Date().toISOString();
    // Cập nhật có điều kiện: tránh 2 cán bộ cùng duyệt 1 hồ sơ (ghi đè lẫn nhau)
    const { data, error } = await supabase
      .from('ho_so')
      .update({
        trang_thai: action,
        phan_hoi_duyet: phanHoi || null,
        nguoi_duyet_id: reviewerId,
        ngay_duyet: now,
        updated_at: now,
      })
      .eq('id', hoSoId)
      .in('trang_thai', ['pending', 'reviewing'])
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new HttpError(409, 'Hồ sơ vừa được xử lý bởi người khác, vui lòng tải lại trang');

    const { error: histErr } = await supabase.from('lich_su_ho_so').insert([{
      ho_so_id: hoSoId,
      tu_trang_thai: existing.trang_thai,
      den_trang_thai: action,
      ghi_chu: (action === 'approved'
        ? `Cán bộ đã duyệt hồ sơ. ${phanHoi}`.trim()
        : `Cán bộ yêu cầu bổ sung hồ sơ. ${phanHoi ? `Lý do: ${phanHoi}` : ''}`.trim())
        + (flagged.length ? `\nTiêu chí cần bổ sung: ${flagged.map((f) => f.ten).join('; ')}` : ''),
      nguoi_thuc_hien_id: reviewerId,
    }]);
    if (histErr) console.warn('Không ghi được lịch sử hồ sơ:', histErr.message);

    notifyReviewResult(existing.sinh_vien_id, data.ma_ho_so, action, phanHoi, flagged); // không chờ

    const message = action === 'approved' ? 'Hồ sơ đã được phê duyệt!' : 'Hồ sơ đã bị từ chối.';
    res.json({ success: true, data, message });
  } catch (err) {
    handleError(res, err, 'reviewer.reviewApplication');
  }
};

// ──────────────────────────────────────────────────
// GET /api/reviewer/stats — Thống kê hồ sơ theo lớp được phân công
// ──────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const { data: assignments, error: assignErr } = await supabase
      .from('reviewer_assignments')
      .select('lop_id, lop_hoc ( id, ma_lop, ten_lop )')
      .eq('reviewer_id', req.user.id);
    if (assignErr) throw assignErr;

    if (!assignments || assignments.length === 0) {
      return res.json({ success: true, data: { classes: [], totals: emptyCounts() } });
    }

    const students = await getStudentIdsByLops(assignments.map((a) => a.lop_id));
    const lopOfStudent = new Map(students.map((s) => [s.id, s.lop_id]));

    let hoSoList = [];
    if (students.length > 0) {
      const { data, error } = await supabase
        .from('ho_so')
        .select('trang_thai, sinh_vien_id')
        .in('sinh_vien_id', students.map((s) => s.id))
        .neq('trang_thai', 'draft');
      if (error) throw error;
      hoSoList = data || [];
    }

    // Gom nhóm 1 lượt O(n) thay vì filter lồng nhau O(lớp × SV × hồ sơ)
    const totals = emptyCounts();
    const byLop = new Map(assignments.map((a) => [a.lop_id, emptyCounts()]));
    for (const h of hoSoList) {
      const c = byLop.get(lopOfStudent.get(h.sinh_vien_id));
      totals.total += 1;
      if (totals[h.trang_thai] !== undefined) totals[h.trang_thai] += 1;
      if (c) {
        c.total += 1;
        if (c[h.trang_thai] !== undefined) c[h.trang_thai] += 1;
      }
    }

    const classes = assignments.map((a) => ({
      id: a.lop_hoc?.id,
      ma_lop: a.lop_hoc?.ma_lop,
      ten_lop: a.lop_hoc?.ten_lop,
      ...byLop.get(a.lop_id),
    }));

    res.json({ success: true, data: { classes, totals } });
  } catch (err) {
    handleError(res, err, 'reviewer.getStats');
  }
};

// ──────────────────────────────────────────────────
// GET /api/reviewer/assigned-classes
// ──────────────────────────────────────────────────
exports.getAssignedClasses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviewer_assignments')
      .select('lop_id, lop_hoc ( id, ma_lop, ten_lop, khoa ( id, ten_khoa ) )')
      .eq('reviewer_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, data: (data || []).map((a) => a.lop_hoc).filter(Boolean) });
  } catch (err) {
    handleError(res, err, 'reviewer.getAssignedClasses');
  }
};

// ──────────────────────────────────────────────────
// ADMIN: Lấy tất cả phân công
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
    handleError(res, err, 'reviewer.getAllAssignments');
  }
};

// ──────────────────────────────────────────────────
// ADMIN: Tạo phân công mới
// ──────────────────────────────────────────────────
exports.createAssignment = async (req, res) => {
  try {
    const reviewer_id = requireId(req.body.reviewer_id, 'Cán bộ');
    const lop_id = requireId(req.body.lop_id, 'Lớp');

    const [reviewerRes, existingRes] = await Promise.all([
      supabase.from('users').select('id, role').eq('id', reviewer_id).maybeSingle(),
      supabase.from('reviewer_assignments').select('id')
        .eq('reviewer_id', reviewer_id).eq('lop_id', lop_id).maybeSingle(),
    ]);
    if (reviewerRes.error) throw reviewerRes.error;
    if (!reviewerRes.data) throw new HttpError(404, 'Không tìm thấy cán bộ');
    if (!['can_bo', 'admin'].includes(reviewerRes.data.role)) {
      throw new HttpError(400, 'Chỉ có thể phân công cho tài khoản Cán bộ');
    }
    if (existingRes.data) throw new HttpError(400, 'Phân công này đã tồn tại.');

    const { data, error } = await supabase
      .from('reviewer_assignments')
      .insert([{ reviewer_id, lop_id }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new HttpError(400, 'Phân công này đã tồn tại.');
      throw error;
    }
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'reviewer.createAssignment');
  }
};

// ──────────────────────────────────────────────────
// ADMIN: Xóa phân công
// ──────────────────────────────────────────────────
exports.deleteAssignment = async (req, res) => {
  try {
    const id = requireId(req.params.id, 'Mã phân công');
    const { error } = await supabase.from('reviewer_assignments').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa phân công.' });
  } catch (err) {
    handleError(res, err, 'reviewer.deleteAssignment');
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
    handleError(res, err, 'reviewer.getAllReviewers');
  }
};

// ──────────────────────────────────────────────────
// POST /api/reviewer/applications/:id/send-email
// ──────────────────────────────────────────────────
exports.sendEmailToStudent = async (req, res) => {
  try {
    const hoSoId = requireId(req.params.id, 'Mã hồ sơ');
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();

    if (!subject || !message) {
      throw new HttpError(400, 'Vui lòng nhập tiêu đề và nội dung email.');
    }
    if (subject.length > 200 || message.length > 5000) {
      throw new HttpError(400, 'Tiêu đề tối đa 200 ký tự, nội dung tối đa 5000 ký tự.');
    }

    const { data: hoSo, error: hsErr } = await supabase
      .from('ho_so')
      .select('id, sinh_vien_id, ma_ho_so, users!ho_so_sinh_vien_id_fkey ( id, email, ho_ten )')
      .eq('id', hoSoId)
      .maybeSingle();
    if (hsErr) throw hsErr;
    if (!hoSo) throw new HttpError(404, 'Không tìm thấy hồ sơ.');

    await assertCanReview(req.user, hoSo.sinh_vien_id);

    const studentEmail = hoSo.users?.email;
    if (!studentEmail) throw new HttpError(400, 'Sinh viên này chưa cập nhật email.');

    // Escape HTML để nội dung cán bộ nhập không chèn được mã HTML/JS vào email
    await sendMail({
      to: studentEmail,
      subject: `[Thông báo Hệ thống SV5T] ${subject.replace(/[\r\n]+/g, ' ')}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4f46e5;">Thông báo từ Cán bộ xét duyệt</h2>
          <p>Chào bạn <strong>${escapeHtml(hoSo.users?.ho_ten || 'Sinh viên')}</strong>,</p>
          <p>Bạn nhận được một yêu cầu/thông báo về hồ sơ <strong>${escapeHtml(hoSo.ma_ho_so || '')}</strong> từ Cán bộ xét duyệt:</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 15px 0; border-radius: 4px;">
            ${escapeHtml(message).replace(/\n/g, '<br/>')}
          </div>
          <p>Vui lòng đăng nhập vào hệ thống để kiểm tra và thực hiện bổ sung nếu cần.</p>
          <br/>
          <p style="font-size: 12px; color: #64748b;">Đây là email tự động, vui lòng không phản hồi.</p>
        </div>
      `,
    });

    res.json({ success: true, message: 'Đã gửi email thành công tới sinh viên.' });
  } catch (err) {
    if (err.code === 'MAIL_NOT_CONFIGURED') {
      return res.status(500).json({ success: false, error: 'Máy chủ chưa cấu hình email (EMAIL_USER / EMAIL_PASS).' });
    }
    handleError(res, err, 'reviewer.sendEmailToStudent');
  }
};
