const supabase = require('../config/db');
const { HttpError, handleError, requireId } = require('../utils/http');

const VALID_LOAI = ['individual', 'collective'];

// Dựng cây cha-con bằng Map: O(n) thay vì filter lồng O(n²)
function buildTree(list) {
  const byParent = new Map();
  for (const tc of list) {
    if (!tc.parent_id) continue;
    if (!byParent.has(tc.parent_id)) byParent.set(tc.parent_id, []);
    byParent.get(tc.parent_id).push(tc);
  }
  return list
    .filter((tc) => !tc.parent_id)
    .map((p) => ({
      ...p,
      children: (byParent.get(p.id) || []).sort((a, b) => (a.thu_tu || 0) - (b.thu_tu || 0)),
    }));
}

// GET /api/tieu-chi — Lấy tất cả tiêu chí (phân cấp cha-con)
exports.getAll = async (req, res) => {
  try {
    const { loai_doi_tuong } = req.query;
    
    let query = supabase
      .from('tieu_chi')
      .select('*')
      .eq('is_active', true)
      .order('thu_tu');

    if (loai_doi_tuong) {
      query = query.eq('loai_doi_tuong', loai_doi_tuong);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data: buildTree(data || []) });
  } catch (err) {
    handleError(res, err, 'tieuChi');
  }
};

// GET /api/tieu-chi/flat — Lấy danh sách phẳng (cho dropdown)
exports.getFlat = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tieu_chi')
      .select('*')
      .eq('is_active', true)
      .order('thu_tu');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'tieuChi');
  }
};

// GET /api/tieu-chi/:id
exports.getById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tieu_chi')
      .select('*')
      .eq('id', requireId(req.params.id))
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Không tìm thấy' });
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'tieuChi');
  }
};

// POST /api/tieu-chi — Tạo tiêu chí (cha hoặc con)
exports.create = async (req, res) => {
  try {
    const { ten_tieu_chi, mo_ta, thu_tu, parent_id, loai_doi_tuong, bat_buoc } = req.body;
    if (!ten_tieu_chi || !String(ten_tieu_chi).trim()) throw new HttpError(400, 'Vui lòng nhập tên tiêu chí');
    if (loai_doi_tuong && !VALID_LOAI.includes(loai_doi_tuong)) throw new HttpError(400, 'Loại đối tượng không hợp lệ');
    const { data, error } = await supabase
      .from('tieu_chi')
      .insert([{ 
        ten_tieu_chi: String(ten_tieu_chi).trim(), 
        mo_ta, 
        thu_tu: thu_tu || 1, 
        parent_id: parent_id || null, 
        loai_doi_tuong: loai_doi_tuong || 'individual',
        bat_buoc: bat_buoc || false,
        is_active: true 
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'tieuChi');
  }
};

// PUT /api/tieu-chi/:id
exports.update = async (req, res) => {
  try {
    const { ten_tieu_chi, mo_ta, thu_tu, parent_id, loai_doi_tuong, bat_buoc } = req.body;
    const updateData = {};
    if (ten_tieu_chi !== undefined) updateData.ten_tieu_chi = ten_tieu_chi;
    if (mo_ta !== undefined) updateData.mo_ta = mo_ta;
    if (thu_tu !== undefined) updateData.thu_tu = thu_tu;
    if (parent_id !== undefined) updateData.parent_id = parent_id;
    if (loai_doi_tuong !== undefined) updateData.loai_doi_tuong = loai_doi_tuong;
    if (bat_buoc !== undefined) updateData.bat_buoc = bat_buoc;

    const id = requireId(req.params.id);
    if (updateData.parent_id !== undefined && Number(updateData.parent_id) === id) {
      throw new HttpError(400, 'Tiêu chí không thể là cha của chính nó');
    }
    if (updateData.parent_id === '') updateData.parent_id = null;
    if (updateData.loai_doi_tuong !== undefined && !VALID_LOAI.includes(updateData.loai_doi_tuong)) {
      throw new HttpError(400, 'Loại đối tượng không hợp lệ');
    }
    if (Object.keys(updateData).length === 0) throw new HttpError(400, 'Không có dữ liệu cần cập nhật');

    const { data, error } = await supabase
      .from('tieu_chi')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err, 'tieuChi');
  }
};

// DELETE /api/tieu-chi/:id (soft delete)
exports.remove = async (req, res) => {
  try {
    const { error } = await supabase
      .from('tieu_chi')
      .update({ is_active: false })
      .eq('id', requireId(req.params.id));

    if (error) throw error;
    res.json({ success: true, message: 'Đã vô hiệu hóa tiêu chí' });
  } catch (err) {
    handleError(res, err, 'tieuChi');
  }
};
