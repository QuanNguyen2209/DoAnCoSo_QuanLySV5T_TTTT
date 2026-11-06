const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

// ── JWT secret ────────────────────────────────────────────────
// KHÔNG dùng chuỗi cố định trong code (ai đọc source cũng giả mạo được token admin).
let JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
if (!JWT_SECRET) {
  JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn(
    '⚠️  Chưa cấu hình JWT_SECRET trong .env — đang dùng secret ngẫu nhiên tạm thời ' +
    '(mọi token sẽ mất hiệu lực khi khởi động lại server).'
  );
}

// ── Cache thông tin user (giảm truy vấn DB ở mỗi request) ─────
// Role/trạng thái luôn lấy từ DB (tối đa trễ USER_CACHE_TTL) thay vì tin role trong token 7 ngày.
const USER_CACHE_TTL = 60 * 1000;
const userCache = new Map();

async function loadUser(id) {
  const hit = userCache.get(id);
  if (hit && hit.exp > Date.now()) return hit.user;

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, ho_ten, lop_id, is_active')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;

  userCache.set(id, { user: data, exp: Date.now() + USER_CACHE_TTL });
  if (userCache.size > 5000) userCache.delete(userCache.keys().next().value);
  return data;
}

function invalidateUserCache(id) {
  userCache.delete(Number(id));
}

// Middleware xác thực JWT token
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc token không hợp lệ' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice(7), JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token hết hạn hoặc không hợp lệ' });
  }

  try {
    const user = await loadUser(Number(decoded.id));
    if (!user) {
      return res.status(401).json({ success: false, error: 'Tài khoản không còn tồn tại' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ success: false, error: 'Tài khoản đã bị vô hiệu hoá' });
    }
    req.user = { id: user.id, email: user.email, role: user.role, ho_ten: user.ho_ten, lop_id: user.lop_id };
    next();
  } catch (err) {
    console.error('authMiddleware:', err);
    return res.status(503).json({ success: false, error: 'Không thể xác thực lúc này, vui lòng thử lại' });
  }
}

// Middleware giới hạn theo role
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này' });
    }
    next();
  };
}

const adminOnly = requireRoles('admin');
const staffOnly = requireRoles('admin', 'can_bo');
const adminOrCanBo = requireRoles('admin', 'can_bo', 'lop_truong');

module.exports = {
  authMiddleware,
  requireRoles,
  adminOnly,
  staffOnly,
  adminOrCanBo,
  invalidateUserCache,
  JWT_SECRET,
};
