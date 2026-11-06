const supabase = require('../config/db');
const { HttpError, handleError, pick, requireId, safeExt, MIME_EXT } = require('../utils/http');
const { loadOwnHoSo, assertCanViewStudentData } = require('../utils/access');
const { ensureMinhChung } = require('../utils/minhChung');
const { attachEventLinks, isMissingSchema } = require('../utils/eventEvidence');

const BUCKET = 'minh-chung';
const MAX_FILES_PER_MINH_CHUNG = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (khớp với giới hạn ở frontend)
const ALLOWED_FILE_TYPES = Object.keys(MIME_EXT); // ảnh, pdf, doc, docx
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'bmp', 'pdf', 'doc', 'docx'];

// Khớp với accept="image/*,.pdf,.doc,.docx" ở frontend; chặn SVG/HTML (có thể chứa script)
function isAllowedFile(fileType, fileName) {
  const type = String(fileType || '').toLowerCase();
  if (type === 'image/svg+xml' || type.includes('html')) return false;
  if (ALLOWED_FILE_TYPES.includes(type) || type.startsWith('image/')) return true;
  const ext = String(fileName || '').split('.').pop().toLowerCase();
  return !type && ALLOWED_EXTS.includes(ext);
}

const MINH_CHUNG_FIELDS = ['tieu_chi_id', 'ten_thanh_tich', 'mo_ta', 'cap_thanh_tich', 'ngay_ghi_nhan'];

const publicUrlPrefix = (hoSoId) =>
  supabase.storage.from(BUCKET).getPublicUrl(`ho-so/${hoSoId}/`).data.publicUrl;

// Lấy minh chứng + kiểm tra hồ sơ cha thuộc về user và còn sửa được
async function loadEditableMinhChung(minhChungId, user) {
  const id = requireId(minhChungId, 'Mã minh chứng');
  const { data: mc, error } = await supabase
    .from('minh_chung')
    .select('id, ho_so_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!mc) throw new HttpError(404, 'Minh chứng không tồn tại');

  const hoSo = await loadOwnHoSo(mc.ho_so_id, user, { editable: true });
  return { mc, hoSo };
}

// Tiêu chí phải tồn tại, đang hoạt động và đúng loại đối tượng của hồ sơ
async function assertValidTieuChi(tieuChiId, hoSo) {
  const id = requireId(tieuChiId, 'Tiêu chí');
  const { data: tc, error } = await supabase
    .from('tieu_chi')
    .select('id, is_active, loai_doi_tuong')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!tc || tc.is_active === false) throw new HttpError(400, 'Tiêu chí không tồn tại hoặc đã bị vô hiệu hoá');
  if (tc.loai_doi_tuong && tc.loai_doi_tuong !== 'both' && tc.loai_doi_tuong !== hoSo.loai_doi_tuong) {
    throw new HttpError(400, 'Tiêu chí không thuộc loại danh hiệu của hồ sơ này');
  }
  return id;
}

// Đường dẫn file trong bucket từ public URL (để xoá file trên Storage)
function storagePathFromUrl(url) {
  const marker = `/object/public/${BUCKET}/`;
  const idx = String(url || '').indexOf(marker);
  return idx >= 0 ? decodeURIComponent(url.slice(idx + marker.length)) : null;
}

// GET /api/minh-chung?ho_so_id=x
exports.getByHoSo = async (req, res) => {
  try {
    const hoSoId = requireId(req.query.ho_so_id, 'ho_so_id');
    const { data: hoSo, error: hsErr } = await supabase
      .from('ho_so').select('id, sinh_vien_id').eq('id', hoSoId).maybeSingle();
    if (hsErr) throw hsErr;
    if (!hoSo) throw new HttpError(404, 'Hồ sơ không tồn tại');
    await assertCanViewStudentData(req.user, hoSo.sinh_vien_id);

    const { data, error } = await supabase
      .from('minh_chung')
      .select('*, tieu_chi(id, ten_tieu_chi), minh_chung_files(*)')
      .eq('ho_so_id', hoSoId)
      .order('created_at');

    if (error) throw error;
    await attachEventLinks(data);
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'minhChung.getByHoSo');
  }
};

// POST /api/minh-chung — Thêm minh chứng (chỉ text, không bắt buộc file)
exports.create = async (req, res) => {
  try {
    const hoSo = await loadOwnHoSo(req.body.ho_so_id, req.user, { editable: true });
    const tieuChiId = await assertValidTieuChi(req.body.tieu_chi_id, hoSo);

    const payload = pick(req.body, MINH_CHUNG_FIELDS);
    const { data, error } = await supabase
      .from('minh_chung')
      .insert([{ ...payload, ho_so_id: hoSo.id, tieu_chi_id: tieuChiId }])
      .select('*, tieu_chi(id, ten_tieu_chi), minh_chung_files(*)')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'minhChung.create');
  }
};

// PUT /api/minh-chung/:id — Cập nhật thông tin text minh chứng
exports.update = async (req, res) => {
  try {
    const { mc, hoSo } = await loadEditableMinhChung(req.params.id, req.user);

    // Chỉ cho sửa field nội dung (không cho đổi ho_so_id sang hồ sơ người khác)
    const payload = pick(req.body, MINH_CHUNG_FIELDS);
    if (payload.tieu_chi_id !== undefined) {
      payload.tieu_chi_id = await assertValidTieuChi(payload.tieu_chi_id, hoSo);
    }
    if (Object.keys(payload).length === 0) throw new HttpError(400, 'Không có dữ liệu cần cập nhật');

    const { data, error } = await supabase
      .from('minh_chung')
      .update(payload)
      .eq('id', mc.id)
      .select('*, minh_chung_files(*)')
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'minhChung.update');
  }
};

// DELETE /api/minh-chung/:id
exports.remove = async (req, res) => {
  try {
    const { mc } = await loadEditableMinhChung(req.params.id, req.user);

    const { data: files } = await supabase
      .from('minh_chung_files').select('file_url').eq('minh_chung_id', mc.id);

    const { error } = await supabase.from('minh_chung').delete().eq('id', mc.id);
    if (error) throw error;

    // Dọn file trên Storage (best-effort)
    const paths = (files || []).map((f) => storagePathFromUrl(f.file_url)).filter(Boolean);
    if (paths.length) supabase.storage.from(BUCKET).remove(paths).catch(() => {});

    res.json({ success: true, message: 'Đã xóa minh chứng' });
  } catch (err) {
    handleError(res, err, 'minhChung.remove');
  }
};

// POST /api/minh-chung/upload-url — Lấy signed URL để upload file lên Supabase Storage
exports.getUploadUrl = async (req, res) => {
  try {
    const { file_name, file_type } = req.body;
    if (!file_name) throw new HttpError(400, 'Thiếu file_name');
    if (!isAllowedFile(file_type, file_name)) {
      throw new HttpError(400, 'Chỉ chấp nhận file ảnh, PDF hoặc Word (DOC, DOCX)');
    }

    const hoSo = await loadOwnHoSo(req.body.ho_so_id, req.user, { editable: true });

    const ext = safeExt(file_type, file_name);
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `ho-so/${hoSo.id}/${Date.now()}-${rand}.${ext}`;

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;

    res.json({
      success: true,
      data: {
        uploadUrl: data.signedUrl,
        path,
        publicUrl: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
      },
    });
  } catch (err) {
    handleError(res, err, 'minhChung.getUploadUrl');
  }
};

// ──────────────────────────────────────────────────
// MULTI-FILE ENDPOINTS (bảng minh_chung_files)
// ──────────────────────────────────────────────────

// POST /api/minh-chung/:id/files — Thêm file vào minh chứng (tối đa 4)
exports.addFile = async (req, res) => {
  try {
    const { mc, hoSo } = await loadEditableMinhChung(req.params.id, req.user);
    const { file_url, file_name, file_size, file_type } = req.body;

    // Chỉ chấp nhận URL file nằm trong thư mục của chính hồ sơ này (chống gắn link tuỳ ý)
    if (!file_url || !String(file_url).startsWith(publicUrlPrefix(hoSo.id))) {
      throw new HttpError(400, 'Đường dẫn file không hợp lệ');
    }
    if (file_size && Number(file_size) > MAX_FILE_SIZE) {
      throw new HttpError(400, 'File không được vượt quá 5MB');
    }

    const { count, error: countErr } = await supabase
      .from('minh_chung_files')
      .select('id', { count: 'exact', head: true })
      .eq('minh_chung_id', mc.id);
    if (countErr) throw countErr;
    if ((count || 0) >= MAX_FILES_PER_MINH_CHUNG) {
      throw new HttpError(400, `Mỗi minh chứng chỉ được tối đa ${MAX_FILES_PER_MINH_CHUNG} file`);
    }

    const { data, error } = await supabase
      .from('minh_chung_files')
      .insert([{
        minh_chung_id: mc.id,
        file_url,
        file_name: file_name ? String(file_name).slice(0, 255) : null,
        file_size: file_size || null,
        file_type: file_type || null,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'minhChung.addFile');
  }
};

// DELETE /api/minh-chung/files/:fileId — Xóa 1 file
exports.removeFile = async (req, res) => {
  try {
    const fileId = requireId(req.params.fileId, 'Mã file');
    const { data: file, error: fErr } = await supabase
      .from('minh_chung_files')
      .select('id, file_url, minh_chung_id')
      .eq('id', fileId)
      .maybeSingle();
    if (fErr) throw fErr;
    if (!file) throw new HttpError(404, 'File không tồn tại');

    await loadEditableMinhChung(file.minh_chung_id, req.user);

    const { error } = await supabase.from('minh_chung_files').delete().eq('id', fileId);
    if (error) throw error;

    const path = storagePathFromUrl(file.file_url);
    if (path) supabase.storage.from(BUCKET).remove([path]).catch(() => {});

    res.json({ success: true, message: 'Đã xóa file' });
  } catch (err) {
    handleError(res, err, 'minhChung.removeFile');
  }
};

// POST /api/minh-chung/upsert-criteria — Tạo hoặc cập nhật minh chứng cho 1 tiêu chí
exports.upsertForCriteria = async (req, res) => {
  try {
    const hoSo = await loadOwnHoSo(req.body.ho_so_id, req.user, { editable: true });
    const tieuChiId = await assertValidTieuChi(req.body.tieu_chi_id, hoSo);
    const mo_ta = req.body.mo_ta ?? '';

    const { mc } = await ensureMinhChung(hoSo.id, tieuChiId, 'id');
    const { data, error } = await supabase
      .from('minh_chung')
      .update({ mo_ta })
      .eq('id', mc.id)
      .select('*, minh_chung_files(*)')
      .single();
    if (error) throw error;

    await attachEventLinks([data]);
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'minhChung.upsertForCriteria');
  }
};

// ──────────────────────────────────────────────────
// SỰ KIỆN ĐÃ THAM GIA → MINH CHỨNG
// ──────────────────────────────────────────────────

const vnDate = (iso) => (iso
  ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
  : '');

// GET /api/minh-chung/goi-y-su-kien?ho_so_id=x
// Các sự kiện SV đã ĐIỂM DANH có gắn tiêu chí thuộc loại danh hiệu của hồ sơ
exports.getEventSuggestions = async (req, res) => {
  try {
    const hoSoId = requireId(req.query.ho_so_id, 'ho_so_id');
    const { data: hoSo, error: hsErr } = await supabase
      .from('ho_so').select('id, sinh_vien_id, loai_doi_tuong').eq('id', hoSoId).maybeSingle();
    if (hsErr) throw hsErr;
    if (!hoSo) throw new HttpError(404, 'Hồ sơ không tồn tại');
    await assertCanViewStudentData(req.user, hoSo.sinh_vien_id);

    const [regsRes, tcRes, mcRes] = await Promise.all([
      supabase
        .from('event_registrations')
        .select('event_id, attended_at, events ( id, title, start_time, location, criteria_ids )')
        .eq('student_id', hoSo.sinh_vien_id)
        .eq('status', 'attended'),
      supabase
        .from('tieu_chi')
        .select('id, ten_tieu_chi, parent_id, loai_doi_tuong')
        .eq('is_active', true)
        .not('parent_id', 'is', null)
        .in('loai_doi_tuong', [hoSo.loai_doi_tuong, 'both']),
      supabase.from('minh_chung').select('id, tieu_chi_id').eq('ho_so_id', hoSo.id),
    ]);
    for (const r of [regsRes, tcRes, mcRes]) if (r.error) throw r.error;

    const mcList = mcRes.data || [];
    const schemaReady = await attachEventLinks(mcList);
    const linked = new Set();
    mcList.forEach((mc) => mc.su_kien.forEach((sk) => linked.add(`${mc.tieu_chi_id}:${sk.event_id}`)));

    const tcMap = new Map((tcRes.data || []).map((tc) => [tc.id, tc]));
    const data = (regsRes.data || [])
      .map((r) => {
        const ev = r.events;
        if (!ev) return null;
        const matching = (ev.criteria_ids || []).map((id) => tcMap.get(Number(id))).filter(Boolean);
        if (matching.length === 0) return null;
        return {
          event: { id: ev.id, title: ev.title, start_time: ev.start_time, location: ev.location },
          attended_at: r.attended_at,
          tieu_chi: matching.map((tc) => ({
            id: tc.id,
            ten_tieu_chi: tc.ten_tieu_chi,
            linked: linked.has(`${tc.id}:${ev.id}`),
          })),
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.event.start_time) - new Date(a.event.start_time));

    res.json({ success: true, data, schema_ready: schemaReady });
  } catch (err) {
    handleError(res, err, 'minhChung.getEventSuggestions');
  }
};

// POST /api/minh-chung/su-kien — Gắn sự kiện đã điểm danh vào minh chứng của 1 tiêu chí
// Body: { ho_so_id, tieu_chi_id, event_id }
exports.linkEvent = async (req, res) => {
  try {
    const hoSo = await loadOwnHoSo(req.body.ho_so_id, req.user, { editable: true });
    const tieuChiId = await assertValidTieuChi(req.body.tieu_chi_id, hoSo);
    const eventId = requireId(req.body.event_id, 'Sự kiện');

    const { data: reg, error: regErr } = await supabase
      .from('event_registrations')
      .select('status, attended_at, events ( id, title, start_time, criteria_ids )')
      .eq('event_id', eventId)
      .eq('student_id', hoSo.sinh_vien_id)
      .maybeSingle();
    if (regErr) throw regErr;
    if (!reg || reg.status !== 'attended' || !reg.events) {
      throw new HttpError(400, 'Bạn chưa điểm danh sự kiện này nên chưa thể dùng làm minh chứng');
    }
    if (!(reg.events.criteria_ids || []).map(Number).includes(tieuChiId)) {
      throw new HttpError(400, 'Sự kiện này không được gắn với tiêu chí đã chọn');
    }

    const { mc } = await ensureMinhChung(hoSo.id, tieuChiId, 'id, mo_ta');

    const { error: linkErr } = await supabase
      .from('minh_chung_su_kien')
      .insert([{ minh_chung_id: mc.id, event_id: eventId }]);
    if (linkErr) {
      if (linkErr.code === '23505') throw new HttpError(400, 'Sự kiện này đã được gắn vào tiêu chí');
      if (isMissingSchema(linkErr)) {
        throw new HttpError(503, 'Hệ thống chưa cập nhật CSDL (chạy database/add_event_evidence_and_feedback.sql)');
      }
      throw linkErr;
    }

    // Tự thêm 1 dòng mô tả để SV không phải gõ lại (SV vẫn sửa được)
    const title = reg.events.title;
    const line = `• Tham gia sự kiện "${title}" ngày ${vnDate(reg.events.start_time)} (đã điểm danh)`;
    const moTa = mc.mo_ta || '';
    const newMoTa = moTa.includes(`"${title}"`) ? moTa : (moTa.trim() ? `${moTa.trimEnd()}\n${line}` : line);

    const { data, error } = await supabase
      .from('minh_chung')
      .update({ mo_ta: newMoTa })
      .eq('id', mc.id)
      .select('*, minh_chung_files(*)')
      .single();
    if (error) throw error;

    await attachEventLinks([data]);
    res.status(201).json({ success: true, data, message: 'Đã gắn sự kiện vào minh chứng' });
  } catch (err) {
    handleError(res, err, 'minhChung.linkEvent');
  }
};

// DELETE /api/minh-chung/su-kien/:linkId — Gỡ sự kiện khỏi minh chứng
exports.unlinkEvent = async (req, res) => {
  try {
    const linkId = requireId(req.params.linkId, 'Mã liên kết');
    const { data: link, error } = await supabase
      .from('minh_chung_su_kien').select('id, minh_chung_id').eq('id', linkId).maybeSingle();
    if (error) {
      if (isMissingSchema(error)) throw new HttpError(503, 'Hệ thống chưa cập nhật CSDL');
      throw error;
    }
    if (!link) throw new HttpError(404, 'Liên kết không tồn tại');

    await loadEditableMinhChung(link.minh_chung_id, req.user);

    const { error: delErr } = await supabase.from('minh_chung_su_kien').delete().eq('id', linkId);
    if (delErr) throw delErr;
    res.json({ success: true, message: 'Đã gỡ sự kiện khỏi minh chứng' });
  } catch (err) {
    handleError(res, err, 'minhChung.unlinkEvent');
  }
};
