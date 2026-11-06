// Lấy (hoặc tạo mới nếu chưa có) minh chứng của 1 tiêu chí trong 1 hồ sơ — an toàn khi gọi song song
const supabase = require('../config/db');

async function ensureMinhChung(hoSoId, tieuChiId, select = '*, minh_chung_files(*)') {
  const find = () => supabase
    .from('minh_chung')
    .select(select)
    .eq('ho_so_id', hoSoId)
    .eq('tieu_chi_id', tieuChiId)
    .order('id')
    .limit(1);

  const { data: rows, error } = await find();
  if (error) throw error;
  if (rows && rows[0]) return { mc: rows[0], created: false };

  const { data, error: insErr } = await supabase
    .from('minh_chung')
    .insert([{ ho_so_id: hoSoId, tieu_chi_id: tieuChiId, ten_thanh_tich: 'Minh chứng tiêu chí', mo_ta: '' }])
    .select(select)
    .single();
  if (!insErr) return { mc: data, created: true };
  if (insErr.code !== '23505') throw insErr;

  // Request song song đã tạo trước
  const again = await find();
  if (again.error) throw again.error;
  return { mc: again.data[0], created: false };
}

module.exports = { ensureMinhChung };
