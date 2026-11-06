// Tiện ích dùng chung cho controller: lỗi HTTP, chuẩn hoá lỗi Supabase/Postgres, lọc field

class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// Chuyển lỗi (HttpError / lỗi Postgres / lỗi bất kỳ) thành response JSON thống nhất
function handleError(res, err, context = 'API') {
  if (res.headersSent) return;

  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, error: err.message, ...err.extra });
  }

  switch (err && err.code) {
    case 'PGRST116': // .single() không có dòng nào
      return res.status(404).json({ success: false, error: 'Không tìm thấy dữ liệu' });
    case '23505': // unique_violation
      return res.status(409).json({ success: false, error: 'Dữ liệu đã tồn tại (bị trùng)' });
    case '23503': // foreign_key_violation
      return res.status(409).json({
        success: false,
        error: 'Ràng buộc dữ liệu: bản ghi liên quan không tồn tại hoặc đang được sử dụng ở nơi khác',
      });
    case '22P02': // invalid_text_representation (vd: id không phải số)
    case '22007': // invalid_datetime_format
    case '22008':
    case '23502': // not_null_violation
    case '23514': // check_violation
      return res.status(400).json({ success: false, error: 'Dữ liệu đầu vào không hợp lệ' });
    default:
      break;
  }

  console.error(`[${context}]`, err);
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(500).json({
    success: false,
    error: isProd ? 'Lỗi server nội bộ' : (err && err.message) || 'Lỗi server nội bộ',
  });
}

// Chỉ lấy các key cho phép và có giá trị khác undefined (chống mass-assignment)
function pick(obj, keys) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const k of keys) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

// Ép kiểu id dương; trả null nếu không hợp lệ
function toId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function requireId(value, label = 'id') {
  const id = toId(value);
  if (!id) throw new HttpError(400, `${label} không hợp lệ`);
  return id;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Bỏ các ký tự đặc biệt của cú pháp filter PostgREST trong chuỗi tìm kiếm (chống filter injection)
function sanitizeSearch(str, maxLen = 100) {
  return String(str ?? '')
    .replace(/[,()*%\\:"]/g, ' ')
    .trim()
    .slice(0, maxLen);
}

// Escape ký tự wildcard cho toán tử ilike/like
function escapeLike(str) {
  return String(str ?? '').replace(/[\\%_]/g, (m) => `\\${m}`);
}

// Lấy phần mở rộng an toàn theo mimetype (không tin tên file người dùng gửi lên)
const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

function safeExt(mimetype, originalName) {
  if (MIME_EXT[mimetype]) return MIME_EXT[mimetype];
  const ext = String(originalName || '').split('.').pop().toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(ext) ? ext : 'bin';
}

module.exports = {
  HttpError,
  handleError,
  pick,
  toId,
  requireId,
  escapeHtml,
  sanitizeSearch,
  escapeLike,
  safeExt,
  MIME_EXT,
};
