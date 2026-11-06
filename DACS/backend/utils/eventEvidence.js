// Gắn danh sách "sự kiện đã tham gia" vào từng minh chứng (bảng minh_chung_su_kien).
// Nếu chưa chạy migration (bảng chưa tồn tại) thì bỏ qua êm, không làm hỏng các trang hiện có.
const supabase = require('../config/db');

let warned = false;

async function attachEventLinks(minhChungList) {
  const list = Array.isArray(minhChungList) ? minhChungList : [];
  list.forEach((mc) => { mc.su_kien = []; });
  const ids = list.map((mc) => mc.id);
  if (ids.length === 0) return true;

  const { data, error } = await supabase
    .from('minh_chung_su_kien')
    .select('id, minh_chung_id, event_id, events ( id, title, start_time, location )')
    .in('minh_chung_id', ids);

  if (error) {
    if (!warned) {
      console.warn('⚠️  Chưa có bảng minh_chung_su_kien — hãy chạy database/add_event_evidence_and_feedback.sql');
      warned = true;
    }
    return false;
  }

  const byMc = new Map(list.map((mc) => [mc.id, mc]));
  for (const link of data || []) {
    const mc = byMc.get(link.minh_chung_id);
    if (mc) mc.su_kien.push({ link_id: link.id, event_id: link.event_id, ...(link.events || {}) });
  }
  return true;
}

// Lỗi do thiếu bảng/cột mới → trả thông báo dễ hiểu
function isMissingSchema(err) {
  return ['42P01', '42703', 'PGRST204', 'PGRST205', 'PGRST200'].includes(err?.code);
}

module.exports = { attachEventLinks, isMissingSchema };
