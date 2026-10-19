const supabase = require('../config/db');
const crypto = require('crypto');

// ── Helpers ─────────────────────────────────────────────────────

function generateCode(length = 6) {
  return crypto.randomBytes(length).toString('hex').toUpperCase().slice(0, length);
}

// ── 1. GET /api/events — Lấy danh sách sự kiện ─────────────────

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('events')
      .select('*, created_by_user:users!events_created_by_fkey(id, ho_ten)')
      .order('start_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Đếm số lượng đã đăng ký cho mỗi sự kiện
    const eventIds = data.map(e => e.id);
    let regCounts = {};
    if (eventIds.length > 0) {
      const { data: regs, error: regErr } = await supabase
        .from('event_registrations')
        .select('event_id')
        .in('event_id', eventIds)
        .in('status', ['registered', 'attended']);
      if (!regErr && regs) {
        regs.forEach(r => {
          regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1;
        });
      }
    }

    // Lấy thông tin tiêu chí cho các criteria_ids
    const allCriteriaIds = Array.from(new Set(data.flatMap(e => e.criteria_ids || [])));
    let criteriaMap = {};
    if (allCriteriaIds.length > 0) {
      const { data: criteriaList } = await supabase
        .from('tieu_chi')
        .select('id, ten_tieu_chi, loai_doi_tuong, parent_id')
        .in('id', allCriteriaIds);
      if (criteriaList) {
        criteriaList.forEach(c => { criteriaMap[c.id] = c; });
      }
    }

    const result = data.map(e => ({
      ...e,
      registered_count: regCounts[e.id] || 0,
      criteria: (e.criteria_ids || []).map(cid => criteriaMap[cid]).filter(Boolean),
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 2. GET /api/events/:id — Chi tiết sự kiện ──────────────────

exports.getById = async (req, res) => {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*, created_by_user:users!events_created_by_fkey(id, ho_ten)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!event) return res.status(404).json({ success: false, error: 'Sự kiện không tồn tại' });

    // Đếm số đã đăng ký
    const { count } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .in('status', ['registered', 'attended']);

    // Kiểm tra sinh viên hiện tại đã đăng ký chưa
    let myRegistration = null;
    if (req.user) {
      const { data: reg } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', event.id)
        .eq('student_id', req.user.id)
        .single();
      myRegistration = reg;
    }

    // Lấy chi tiết tiêu chí gắn với sự kiện
    let criteria = [];
    if (event.criteria_ids && event.criteria_ids.length > 0) {
      const { data: criteriaList } = await supabase
        .from('tieu_chi')
        .select('id, ten_tieu_chi, mo_ta, loai_doi_tuong, parent_id')
        .in('id', event.criteria_ids);
      criteria = criteriaList || [];
    }

    // Ẩn attendance_code cho sinh viên (chỉ admin thấy)
    const isAdmin = req.user && req.user.role === 'admin';
    const safeEvent = {
      ...event,
      attendance_code: isAdmin ? event.attendance_code : undefined,
      registered_count: count || 0,
      my_registration: myRegistration,
      criteria,
    };

    res.json({ success: true, data: safeEvent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 3. POST /api/events — Tạo sự kiện mới (Admin) ──────────────

exports.create = async (req, res) => {
  try {
    const { title, description, location, image_url, criteria_ids, start_time, end_time, max_participants, status } = req.body;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin: title, start_time, end_time là bắt buộc' });
    }

    if (new Date(end_time) <= new Date(start_time)) {
      return res.status(400).json({ success: false, error: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
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
        max_participants: max_participants || 0,
        status: status || 'draft',
        created_by: req.user.id,
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

    const { data, error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 6. POST /api/events/:id/register — Sinh viên đăng ký ───────

exports.register = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
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

    // Kiểm tra đã đăng ký chưa
    const { data: existing } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .single();

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

    // Nếu đã hủy trước đó → cập nhật lại
    if (existing && existing.status === 'cancelled') {
      const { data, error } = await supabase
        .from('event_registrations')
        .update({ status: 'registered', registered_at: new Date().toISOString(), attended_at: null })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, data, message: 'Đăng ký sự kiện thành công' });
    }

    // Tạo mới
    const { data, error } = await supabase
      .from('event_registrations')
      .insert([{ event_id: eventId, student_id: studentId, status: 'registered' }])
      .select()
      .single();

    if (error) {
      // Unique constraint violation → đã đăng ký
      if (error.code === '23505') {
        return res.status(400).json({ success: false, error: 'Bạn đã đăng ký sự kiện này rồi' });
      }
      throw error;
    }

    res.status(201).json({ success: true, data, message: 'Đăng ký sự kiện thành công' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 7. POST /api/events/:id/cancel-registration — Hủy đăng ký ──

exports.cancelRegistration = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
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
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 8. POST /api/events/:id/generate-attendance-code — Sinh mã (Admin) ─

exports.generateAttendanceCode = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const { expires_in_minutes } = req.body; // Mặc định 30 phút

    const code = generateCode(6);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (expires_in_minutes || 30));

    const { data, error } = await supabase
      .from('events')
      .update({
        attendance_code: code,
        is_attendance_open: true,
        attendance_expires_at: expiresAt.toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        attendance_code: code,
        is_attendance_open: true,
        attendance_expires_at: expiresAt.toISOString(),
      },
      message: 'Đã sinh mã điểm danh thành công',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 9. POST /api/events/:id/close-attendance — Đóng điểm danh (Admin) ──

exports.closeAttendance = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

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
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 10. POST /api/events/:id/check-in — Sinh viên điểm danh ────

exports.checkIn = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const studentId = req.user.id;
    const { code } = req.body;

    if (!code || !code.trim()) {
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
    if (code.trim().toUpperCase() !== event.attendance_code?.toUpperCase()) {
      return res.status(400).json({ success: false, error: 'Mã điểm danh không chính xác' });
    }

    // Kiểm tra đã đăng ký chưa
    const { data: reg } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .single();

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
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data, message: 'Điểm danh thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── 11. GET /api/events/:id/attendance-list — Danh sách điểm danh (Admin) ──

exports.getAttendanceList = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);

    const { data, error } = await supabase
      .from('event_registrations')
      .select('*, student:users!event_registrations_student_id_fkey(id, ho_ten, ma_sv, email)')
      .eq('event_id', eventId)
      .order('registered_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    const ext = file.originalname.split('.').pop() || 'jpg';
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
    res.status(500).json({ success: false, error: err.message });
  }
};
