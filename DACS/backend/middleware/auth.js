const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'sv5t_secret_key_2026';

// Middleware xác thực JWT token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc token không hợp lệ' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, ho_ten }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token hết hạn hoặc không hợp lệ' });
  }
}

// Middleware kiểm tra quyền admin
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Chỉ Admin mới có quyền thực hiện thao tác này' });
  }
  next();
}

// Middleware kiểm tra quyền admin hoặc cán bộ (can_bo) hoặc lớp trưởng
function adminOrCanBo(req, res, next) {
  const allowed = ['admin', 'can_bo', 'lop_truong'];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Chỉ Admin, Cán bộ hoặc Lớp trưởng mới có quyền thực hiện thao tác này' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, adminOrCanBo, JWT_SECRET };
