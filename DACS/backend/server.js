const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cấu hình môi trường
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by');
// Khi deploy sau reverse proxy (Render, Nginx...) đặt TRUST_PROXY=1 để giới hạn tần suất nhận đúng IP người dùng
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// Kết nối Supabase (kiểm tra ngay khi khởi động)
require('./config/db');

// ── Routes ──────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const kyXetDuyetRoutes  = require('./routes/kyXetDuyet');
const tieuChiRoutes     = require('./routes/tieuChi');
const hoSoRoutes        = require('./routes/hoSo');
const minhChungRoutes   = require('./routes/minhChung');
const userRoutes        = require('./routes/users');
const khoaRoutes        = require('./routes/khoa');
const lopHocRoutes      = require('./routes/lopHoc');
const userProfileRoutes = require('./routes/userProfiles');
const reviewerRoutes    = require('./routes/reviewer');
const vinhDanhRoutes    = require('./routes/vinhDanh');
const pdfRoutes         = require('./routes/pdf');
const eventRoutes       = require('./routes/events');

app.use('/api/auth',         authRoutes);
app.use('/api/ky-xet-duyet', kyXetDuyetRoutes);
app.use('/api/tieu-chi',     tieuChiRoutes);
app.use('/api/ho-so',        hoSoRoutes);
app.use('/api/minh-chung',   minhChungRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/khoa',         khoaRoutes);
app.use('/api/lop-hoc',      lopHocRoutes);
app.use('/api/user-profiles',userProfileRoutes);
app.use('/api/reviewer',     reviewerRoutes);
app.use('/api/vinh-danh',    vinhDanhRoutes);
app.use('/api/pdf',          pdfRoutes);
app.use('/api/events',       eventRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Server đang chạy...', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại' });
});

// Global error handler (bắt cả lỗi multer: file quá lớn / sai định dạng → 400 thay vì 500)
app.use((err, req, res, next) => {
  if (err && (err.name === 'MulterError' || /Chỉ chấp nhận/.test(err.message || ''))) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File vượt quá dung lượng cho phép' : err.message;
    return res.status(400).json({ success: false, error: msg });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Dữ liệu JSON không hợp lệ' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Dữ liệu gửi lên quá lớn' });
  }
  console.error('Lỗi server:', err);
  res.status(500).json({
    success: false,
    error: 'Lỗi server nội bộ',
    ...(process.env.NODE_ENV !== 'production' && { detail: err.message }),
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// Chạy server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
