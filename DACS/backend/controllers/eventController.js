const supabase = require('../config/db');
const crypto = require('crypto');
const { HttpError, handleError, requireId, safeExt } = require('../utils/http');
const { currentToken, verifyToken } = require('../utils/attendance');

const VALID_STATUS = ['draft', 'published', 'closed'];
const isAdminUser = (user) => user && user.role === 'admin';

// Ẩn thông tin nhạy cảm với người không phải admin (mã điểm danh!)
function sanitizeEvent(event, user) {
  if (isAdminUser(user)) return event;
  const { attendance_code, ...rest } = event;
  return rest;
}

// ── Helpers ─────────────────────────────────────────────────────

function generateCode(length = 6) {
  return crypto.randomBytes(length).toString('hex').toUpperCase().slice(0, length);
}

// ── 1. GET /api/events — Lấy danh sách sự kiện ─────────────────

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const admin = isAdminUser(req.user);
    let query = supabase
      .from('events')
      .select('*, created_by_user:users!events_created_by_fkey(id, ho_ten)')
      .order('start_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    // Sinh viên không được thấy sự kiện nháp
    if (!admin) query = query.neq('status', 'draft');

    const { data, error } = await query;
    if (error) throw error;

    const eventIds = data.map(e => e.id);
    const allCriteriaIds = Array.from(new Set(data.flatMap(e => e.criteria_ids || [])));

    // Chạy song song: đếm đăng ký + lấy tiêu chí + đăng ký của chính SV
    const [regsRes, criteriaRes, myRegsRes] = await Promise.all([
      eventIds.length
        ? supabase.from('event_registrations').select('event_id')
            .in('event_id', eventIds).in('status', ['registered', 'attended'])
        : Promise.resolve({ data: [] }),
      allCriteriaIds.length
        ? supabase.from('tieu_chi').select('id, ten_tieu_chi, loai_doi_tuong, parent_id').in('id', allCriteriaIds)
        : Promise.resolve({ data: [] }),
      eventIds.length && !admin
        ? supabase.from('event_registrations').select('*').in('event_id', eventIds).eq('student_id', req.user.id)
        : Promise.resolve({ data: [] }),
    ]);

    const regCounts = {};
    (regsRes.data || []).forEach(r => { regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1; });
    const criteriaMap = {};
    (criteriaRes.data || []).forEach(c => { criteriaMap[c.id] = c; });
    const myRegMap = {};
    (myRegsRes.data || []).forEach(r => { myRegMap[r.event_id] = r; });

    const result = data.map(e => ({
      ...sanitizeEvent(e, req.user),
      registered_count: regCounts[e.id] || 0,
      criteria: (e.criteria_ids || []).map(cid => criteriaMap[cid]).filter(Boolean),
      ...(admin ? {} : { my_registration: myRegMap[e.id] || null }),
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 2. GET /api/events/:id — Chi tiết sự kiện ──────────────────

exports.getById = async (req, res) => {
  try {
    const eventId = requireId(req.params.id, 'Mã sự kiện');
    const { data: event, error } = await supabase
      .from('events')
      .select('*, created_by_user:users!events_created_by_fkey(id, ho_ten)')
      .eq('id', eventId)
      .maybeSingle();

    if (error) throw error;
    if (!event || (event.status === 'draft' && !isAdminUser(req.user))) {
      return res.status(404).json({ success: false, error: 'Sự kiện không tồn tại' });
    }

    // 3 truy vấn độc lập → chạy song song
    const [countRes, regRes, criteriaRes] = await Promise.all([
      supabase.from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .in('status', ['registered', 'attended']),
      supabase.from('event_registrations')
        .select('*')
        .eq('event_id', event.id)
        .eq('student_id', req.user.id)
        .maybeSingle(),
      event.criteria_ids && event.criteria_ids.length > 0
        ? supabase.from('tieu_chi').select('id, ten_tieu_chi, mo_ta, loai_doi_tuong, parent_id').in('id', event.criteria_ids)
        : Promise.resolve({ data: [] }),
    ]);

    const safeEvent = {
      ...sanitizeEvent(event, req.user), // Ẩn attendance_code cho sinh viên
      registered_count: countRes.count || 0,
      my_registration: regRes.data || null,
      criteria: criteriaRes.data || [],
    };

    res.json({ success: true, data: safeEvent });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 3. POST /api/events — Tạo sự kiện mới (Admin) ──────────────

exports.create = async (req, res) => {
  try {
    const { title, description, location, image_url, criteria_ids, start_time, end_time, max_participants, status } = req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin: title, start_time, end_time là bắt buộc' });
    }

    if (isNaN(new Date(start_time)) || isNaN(new Date(end_time))) {
      return res.status(400).json({ success: false, error: 'Thời gian không hợp lệ' });
    }
    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({ success: false, error: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
    }
    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ success: false, error: 'Trạng thái sự kiện không hợp lệ' });
    }
    if (max_participants !== undefined && (!Number.isInteger(Number(max_participants)) || Number(max_participants) < 0)) {
      return res.status(400).json({ success: false, error: 'Số lượng tối đa phải là số nguyên không âm' });
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{
        title,
        description: description || null,
        location: location || null,
        image_url: image_url || null,
        criteria_ids: Array.isArray(criteria_ids) ? criteria_ids : [],
        start_time,
        end_time,
        max_participants: Number(max_participants) || 0,
        status: status || 'draft',
        created_by: req.user.id,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 4. PUT /api/events/:id — Cập nhật sự kiện (Admin) ──────────

exports.update = async (req, res) => {
  try {
    const { title, description, location, image_url, criteria_ids, start_time, end_time, max_participants, status } = req.body;

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (location !== undefined) updatePayload.location = location;
    if (image_url !== undefined) updatePayload.image_url = image_url;
    if (criteria_ids !== undefined) updatePayload.criteria_ids = Array.isArray(criteria_ids) ? criteria_ids : [];
    if (start_time !== undefined) updatePayload.start_time = start_time;
    if (end_time !== undefined) updatePayload.end_time = end_time;
    if (max_participants !== undefined) updatePayload.max_participants = max_participants;
    if (status !== undefined) updatePayload.status = status;

    if (status !== undefined && !VALID_STATUS.includes(status)) {
      throw new HttpError(400, 'Trạng thái sự kiện không hợp lệ');
    }
    if (Object.keys(updatePayload).length === 0) throw new HttpError(400, 'Không có dữ liệu cần cập nhật');

    const eventId = requireId(req.params.id, 'Mã sự kiện');
    // Nếu đổi thời gian, kiểm tra kết thúc > bắt đầu (so với giá trị hiện có)
    if (start_time !== undefined || end_time !== undefined) {
      const { data: cur, error: curErr } = await supabase
        .from('events').select('start_time, end_time').eq('id', eventId).maybeSingle();
      if (curErr) throw curErr;
      if (!cur) throw new HttpError(404, 'Sự kiện không tồn tại');
      const s = new Date(start_time ?? cur.start_time);
      const e = new Date(end_time ?? cur.end_time);
      if (isNaN(s) || isNaN(e) || e <= s) throw new HttpError(400, 'Thời gian kết thúc phải sau thời gian bắt đầu');
    }

    const { data, error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', eventId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new HttpError(404, 'Sự kiện không tồn tại');
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 5. DELETE /api/events/:id — Xóa sự kiện (Admin) ────────────

exports.remove = async (req, res) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Đã xóa sự kiện thành công' });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 6. POST /api/events/:id/register — Sinh viên đăng ký ───────

exports.register = async (req, res) => {
  try {
    const eventId = requireId(req.params.id, 'Mã sự kiện');
    const studentId = req.user.id;

    // Lấy thông tin sự kiện
    const { data: event, error: evErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (evErr || !event) {
      return res.status(404).json({ success: false, error: 'Sự kiện không tồn tại' });
    }

    if (event.status !== 'published') {
      return res.status(400).json({ success: false, error: 'Sự kiện chưa được mở đăng ký' });
    }
    if (new Date(event.end_time) < new Date()) {
      return res.status(400).json({ success: false, error: 'Sự kiện đã kết thúc, không thể đăng ký' });
    }

    // Kiểm tra đã đăng ký chưa
    const { data: existing, error: exErr } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (exErr) throw exErr;

    if (existing && existing.status !== 'cancelled') {
      return res.status(400).json({ success: false, error: 'Bạn đã đăng ký sự kiện này rồi' });
    }

    // Kiểm tra giới hạn số lượng (Race condition: sử dụng count + kiểm tra lại)
    if (event.max_participants > 0) {
      const { count } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .in('status', ['registered', 'attended']);

      if (count >= event.max_participants) {
        return res.status(400).json({ success: false, error: 'Sự kiện đã đầy, không thể đăng ký thêm' });
      }
    }

    let data;
    if (existing && existing.status === 'cancelled') {
      // Đã hủy trước đó → đăng ký lại
      const upd = await supabase
        .from('event_registrations')
        .update({ status: 'registered', registered_at: new Date().toISOString(), attended_at: null })
        .eq('id', existing.id)
        .eq('status', 'cancelled')
        .select()
        .maybeSingle();
      if (upd.error) throw upd.error;
      if (!upd.data) return res.status(400).json({ success: false, error: 'Bạn đã đăng ký sự kiện này rồi' });
      data = upd.data;
    } else {
      const ins = await supabase
        .from('event_registrations')
        .insert([{ event_id: eventId, student_id: studentId, status: 'registered' }])
        .select()
        .single();
      if (ins.error) {
        if (ins.error.code === '23505') {
          return res.status(400).json({ success: false, error: 'Bạn đã đăng ký sự kiện này rồi' });
        }
        throw ins.error;
      }
      data = ins.data;
    }

    // Kiểm tra lại sau khi ghi: nếu nhiều SV đăng ký cùng lúc làm vượt chỉ tiêu → hoàn tác suất này
    if (event.max_participants > 0) {
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .in('status', ['registered', 'attended']);
      if (count > event.max_participants) {
        await supabase.from('event_registrations').update({ status: 'cancelled' }).eq('id', data.id);
        return res.status(400).json({ success: false, error: 'Sự kiện đã đầy, không thể đăng ký thêm' });
      }
    }

    res.status(existing ? 200 : 201).json({ success: true, data, message: 'Đăng ký sự kiện thành công' });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 7. POST /api/events/:id/cancel-registration — Hủy đăng ký ──

exports.cancelRegistration = async (req, res) => {
  try {
    const eventId = requireId(req.params.id, 'Mã sự kiện');
    const studentId = req.user.id;

    const { data, error } = await supabase
      .from('event_registrations')
      .update({ status: 'cancelled' })
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .eq('status', 'registered')
      .select()
      .single();

    if (error || !data) {
      return res.status(400).json({ success: false, error: 'Không thể hủy đăng ký. Có thể bạn chưa đăng ký hoặc đã điểm danh.' });
    }

    res.json({ success: true, data, message: 'Đã hủy đăng ký thành công' });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 8. POST /api/events/:id/generate-attendance-code — Sinh mã (Admin) ─

exports.generateAttendanceCode = async (req, res) => {
  try {
    const eventId = requireId(req.params.id, 'Mã sự kiện');
    const minutes = Number(req.body.expires_in_minutes) || 30; // Mặc định 30 phút
    if (minutes < 1 || minutes > 24 * 60) {
      throw new HttpError(400, 'Thời gian hiệu lực mã phải từ 1 đến 1440 phút');
    }

    // attendance_code giờ là "hạt giống" bí mật; mã hiển thị cho SV được sinh lại mỗi 30 giây từ hạt giống này
    const code = generateCode(16);
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

    const { data, error } = await supabase
      .from('events')
      .update({
        attendance_code: code,
        is_attendance_open: true,
        attendance_expires_at: expiresAt.toISOString(),
      })
      .eq('id', eventId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new HttpError(404, 'Sự kiện không tồn tại');

    res.json({
      success: true,
      data: {
        attendance_code: code,
        is_attendance_open: true,
        attendance_expires_at: expiresAt.toISOString(),
        ...currentToken(eventId, code),
      },
      message: 'Đã sinh mã điểm danh thành công',
    });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 9. POST /api/events/:id/close-attendance — Đóng điểm danh (Admin) ──

exports.closeAttendance = async (req, res) => {
  try {
    const eventId = requireId(req.params.id, 'Mã sự kiện');

    const { data, error } = await supabase
      .from('events')
      .update({
        is_attendance_open: false,
        attendance_code: null,
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data, message: 'Đã đóng cổng điểm danh' });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 10. POST /api/events/:id/check-in — Sinh viên điểm danh ────

exports.checkIn = async (req, res) => {
  try {
    const eventId = requireId(req.params.id, 'Mã sự kiện');
    const studentId = req.user.id;
    const { code } = req.body;

    if (!code || !String(code).trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập mã điểm danh' });
    }

    // Lấy sự kiện
    const { data: event, error: evErr } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (evErr || !event) {
      return res.status(404).json({ success: false, error: 'Sự kiện không tồn tại' });
    }

    // Kiểm tra cổng điểm danh có mở không
    if (!event.is_attendance_open) {
      return res.status(400).json({ success: false, error: 'Cổng điểm danh chưa mở hoặc đã đóng' });
    }

    // Kiểm tra mã hết hạn
    if (event.attendance_expires_at && new Date(event.attendance_expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Mã điểm danh đã hết hạn' });
    }

    // Kiểm tra mã đúng không (case insensitive)
    // Mã xoay vòng 30 giây (chấp nhận mã của 30 giây trước để bù độ trễ khi quét QR)
    if (!verifyToken(event.id, event.attendance_code, code)) {
      return res.status(400).json({ success: false, error: 'Mã điểm danh không chính xác' });
    }

    // Kiểm tra đã đăng ký chưa
    const { data: reg, error: regErr } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (regErr) throw regErr;

    if (!reg) {
      return res.status(400).json({ success: false, error: 'Bạn chưa đăng ký sự kiện này' });
    }

    if (reg.status === 'attended') {
      return res.status(400).json({ success: false, error: 'Bạn đã điểm danh thành công trước đó rồi' });
    }

    if (reg.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Đăng ký của bạn đã bị hủy' });
    }

    // Cập nhật trạng thái
    const { data, error } = await supabase
      .from('event_registrations')
      .update({ status: 'attended', attended_at: new Date().toISOString() })
      .eq('id', reg.id)
      .eq('status', 'registered')
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(400).json({ success: false, error: 'Bạn đã điểm danh thành công trước đó rồi' });

    res.json({ success: true, data, message: 'Điểm danh thành công!' });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 10b. GET /api/events/:id/attendance-token — Mã điểm danh hiện tại (Admin, để chiếu QR) ─
exports.getAttendanceToken = async (req, res) => {
  try {
    const eventId = requireId(req.params.id, 'Mã sự kiện');
    const { data: event, error } = await supabase
      .from('events')
      .select('id, attendance_code, is_attendance_open, attendance_expires_at')
      .eq('id', eventId)
      .maybeSingle();
    if (error) throw error;
    if (!event) throw new HttpError(404, 'Sự kiện không tồn tại');
    if (!event.is_attendance_open || !event.attendance_code) throw new HttpError(400, 'Cổng điểm danh đang đóng');
    if (event.attendance_expires_at && new Date(event.attendance_expires_at) < new Date()) {
      throw new HttpError(400, 'Phiên điểm danh đã hết hạn, hãy mở phiên mới');
    }
    res.json({ success: true, data: { ...currentToken(event.id, event.attendance_code), attendance_expires_at: event.attendance_expires_at } });
  } catch (err) {
    handleError(res, err, 'events.getAttendanceToken');
  }
};

// ── 11. GET /api/events/:id/attendance-list — Danh sách điểm danh (Admin) ──

exports.getAttendanceList = async (req, res) => {
  try {
    const eventId = requireId(req.params.id, 'Mã sự kiện');

    const { data, error } = await supabase
      .from('event_registrations')
      .select('*, student:users!event_registrations_student_id_fkey(id, ho_ten, ma_sv, email)')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'events');
  }
};

// ── 12. POST /api/events/upload-banner — Upload ảnh banner lên Supabase Storage ──

exports.uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Chưa chọn file ảnh' });
    }

    const file = req.file;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF)' });
    }

    // Tên file duy nhất
    const ext = safeExt(file.mimetype, file.originalname);
    const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { data, error } = await supabase.storage
      .from('events')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('events')
      .getPublicUrl(fileName);

    res.json({
      success: true,
      data: {
        url: publicData.publicUrl,
        fileName,
      },
      message: 'Tải ảnh lên thành công!',
    });
  } catch (err) {
    handleError(res, err, 'events');
  }
};
