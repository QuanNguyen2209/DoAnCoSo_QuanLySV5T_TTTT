const supabase = require('../config/db');

// ──────────────────────────────────────────────────
// GET /api/vinh-danh
// Lấy danh sách sinh viên được vinh danh (hồ sơ approved)
// ──────────────────────────────────────────────────
exports.getHonorRoll = async (req, res) => {
  try {
    const { ky_xet_duyet_id, khoa_id, search } = req.query;

    // 1. Lấy tất cả hồ sơ đã approved, join thêm user_profiles để lấy avatar nếu có
    let query = supabase
      .from('ho_so')
      .select(`
        id, ma_ho_so, loai_doi_tuong, ngay_duyet, cap_xet_duyet,
        users!ho_so_sinh_vien_id_fkey (
          id, ho_ten, ma_sv, email, avatar_url, lop_id,
          lop_hoc ( id, ma_lop, ten_lop, khoa_id, khoa ( id, ma_khoa, ten_khoa ) ),
          user_profiles ( id )
        ),
        ky_xet_duyet ( id, ten_ky, nam_hoc, loai ),
        minh_chung ( id )
      `)
      .eq('trang_thai', 'approved')
      .order('ngay_duyet', { ascending: false });

    // Filter theo kỳ xét duyệt
    if (ky_xet_duyet_id && ky_xet_duyet_id !== 'all') {
      query = query.eq('ky_xet_duyet_id', ky_xet_duyet_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    let records = data || [];

    // Filter theo khoa (phải filter phía server vì nested)
    if (khoa_id && khoa_id !== 'all') {
      records = records.filter(r =>
        r.users?.lop_hoc?.khoa_id === parseInt(khoa_id)
      );
    }

    // Filter theo search
    if (search) {
      const s = search.toLowerCase();
      records = records.filter(r =>
        r.users?.ho_ten?.toLowerCase().includes(s) ||
        r.users?.ma_sv?.toLowerCase().includes(s)
      );
    }

    // 2. Transform & Group by sinh viên (đếm số lần đạt)
    const studentMap = new Map();

    records.forEach(r => {
      const svId = r.users?.id;
      if (!svId) return;

      if (studentMap.has(svId)) {
        const existing = studentMap.get(svId);
        existing.so_lan_dat += 1;
        existing.ho_so_list.push({
          id: r.id,
          ma_ho_so: r.ma_ho_so,
          loai_doi_tuong: r.loai_doi_tuong,
          ngay_duyet: r.ngay_duyet,
          cap_xet_duyet: r.cap_xet_duyet,
          ky_xet_duyet: r.ky_xet_duyet,
          so_minh_chung: (r.minh_chung || []).length,
        });
      } else {
        studentMap.set(svId, {
          sinh_vien: {
            id: r.users.id,
            ho_ten: r.users.ho_ten,
            ma_sv: r.users.ma_sv,
            email: r.users.email,
            // Ưu tiên avatar_url từ bảng users
            avatar_url: r.users.avatar_url || null,
            lop: r.users.lop_hoc ? {
              id: r.users.lop_hoc.id,
              ma_lop: r.users.lop_hoc.ma_lop,
              ten_lop: r.users.lop_hoc.ten_lop,
            } : null,
            khoa: r.users.lop_hoc?.khoa ? {
              id: r.users.lop_hoc.khoa.id,
              ma_khoa: r.users.lop_hoc.khoa.ma_khoa,
              ten_khoa: r.users.lop_hoc.khoa.ten_khoa,
            } : null,
          },
          so_lan_dat: 1,
          ho_so_list: [{
            id: r.id,
            ma_ho_so: r.ma_ho_so,
            loai_doi_tuong: r.loai_doi_tuong,
            ngay_duyet: r.ngay_duyet,
            cap_xet_duyet: r.cap_xet_duyet,
            ky_xet_duyet: r.ky_xet_duyet,
            so_minh_chung: (r.minh_chung || []).length,
          }],
        });
      }
    });

    // Sắp xếp: SV nhiều lần đạt lên trước
    const result = Array.from(studentMap.values())
      .sort((a, b) => b.so_lan_dat - a.so_lan_dat);

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Lỗi getHonorRoll:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// GET /api/vinh-danh/stats
// Thống kê tổng quan vinh danh
// ──────────────────────────────────────────────────
exports.getHonorStats = async (req, res) => {
  try {
    // Lấy tất cả hồ sơ approved
    const { data: hoSoList, error } = await supabase
      .from('ho_so')
      .select(`
        id, sinh_vien_id, ky_xet_duyet_id,
        users!ho_so_sinh_vien_id_fkey ( id, lop_id, lop_hoc ( khoa_id ) ),
        ky_xet_duyet ( id, ten_ky, nam_hoc )
      `)
      .eq('trang_thai', 'approved');

    if (error) throw error;

    const records = hoSoList || [];

    // Tổng SV unique
    const uniqueStudents = new Set(records.map(r => r.sinh_vien_id));

    // Theo khoa
    const khoaMap = new Map();
    records.forEach(r => {
      const khoaId = r.users?.lop_hoc?.khoa_id;
      if (khoaId) {
        khoaMap.set(khoaId, (khoaMap.get(khoaId) || 0) + 1);
      }
    });

    // Theo kỳ
    const kyMap = new Map();
    records.forEach(r => {
      const kyId = r.ky_xet_duyet_id;
      if (kyId) {
        const existing = kyMap.get(kyId) || { count: 0, ten_ky: r.ky_xet_duyet?.ten_ky, nam_hoc: r.ky_xet_duyet?.nam_hoc };
        existing.count += 1;
        kyMap.set(kyId, existing);
      }
    });

    res.json({
      success: true,
      data: {
        tong_sv_vinh_danh: uniqueStudents.size,
        tong_ho_so_approved: records.length,
        so_khoa: khoaMap.size,
        theo_ky: Array.from(kyMap.entries()).map(([id, v]) => ({
          ky_xet_duyet_id: id,
          ten_ky: v.ten_ky,
          nam_hoc: v.nam_hoc,
          so_luong: v.count,
        })),
      },
    });
  } catch (err) {
    console.error('Lỗi getHonorStats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// GET /api/vinh-danh/poster-template
// Lấy URL mẫu poster hiện tại
// ──────────────────────────────────────────────────
exports.getPosterTemplate = async (req, res) => {
  try {
    // Liệt kê file trong bucket poster-templates, lấy file mới nhất (bỏ qua config json)
    const { data: files, error } = await supabase.storage
      .from('poster-templates')
      .list('', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });

    if (error) throw error;

    const imageFiles = (files || []).filter(f => f.name && f.name.startsWith('template_'));

    if (imageFiles.length === 0) {
      return res.json({ success: true, data: null, message: 'Chưa có mẫu poster nào.' });
    }

    const latestFile = imageFiles[0];
    const { data: urlData } = supabase.storage
      .from('poster-templates')
      .getPublicUrl(latestFile.name);

    res.json({
      success: true,
      data: {
        file_name: latestFile.name,
        url: urlData.publicUrl,
        created_at: latestFile.created_at,
      },
    });
  } catch (err) {
    console.error('Lỗi getPosterTemplate:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// POST /api/vinh-danh/poster-template
// Upload mẫu poster mới (admin only)
// Nhận file trực tiếp qua multipart/form-data (multer)
// ──────────────────────────────────────────────────
exports.uploadPosterTemplate = async (req, res) => {
  try {
    // req.file được inject bởi multer trong route
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy file trong request.' });
    }

    const { originalname, buffer, mimetype } = req.file;
    const ext = originalname.split('.').pop();
    const path = `template_${Date.now()}.${ext}`;

    // Upload buffer trực tiếp lên Supabase Storage bằng Service Role
    const { error } = await supabase.storage
      .from('poster-templates')
      .upload(path, buffer, {
        contentType: mimetype,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('poster-templates')
      .getPublicUrl(path);

    res.json({
      success: true,
      data: {
        path,
        publicUrl: urlData.publicUrl,
      },
    });
  } catch (err) {
    console.error('Lỗi uploadPosterTemplate:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ──────────────────────────────────────────────────
// GET /api/vinh-danh/config
// Lấy trạng thái vinh danh từ Supabase Storage
// ──────────────────────────────────────────────────
exports.getConfig = async (req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from('app-config')
      .download('vinh_danh_config.json');

    if (error || !data) {
      return res.json({ success: true, data: { published: false } });
    }

    const text = await data.text();
    const config = JSON.parse(text);
    res.json({ success: true, data: config });
  } catch (err) {
    res.json({ success: true, data: { published: false } });
  }
};

// ──────────────────────────────────────────────────
// PUT /api/vinh-danh/config
// Chỉ Admin được bật/tắt vinh danh
// Body: { published: true/false }
// ──────────────────────────────────────────────────
exports.updateConfig = async (req, res) => {
  try {
    const { published } = req.body;
    const config = { published: !!published, updated_at: new Date().toISOString() };

    // Lưu dưới dạng text/plain — bucket poster-templates không chặn mime type này
    const jsonBuffer = Buffer.from(JSON.stringify(config), 'utf-8');

    const { error } = await supabase.storage
      .from('app-config')
      .upload('vinh_danh_config.json', jsonBuffer, {
        upsert: true,
        contentType: 'application/json',
      });

    if (error) throw error;

    res.json({
      success: true,
      data: config,
      message: published ? 'Đã công bố bảng vinh danh!' : 'Đã ẩn bảng vinh danh.',
    });
  } catch (err) {
    console.error('Lỗi updateConfig:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
