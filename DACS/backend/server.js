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
app.use(express.json());

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

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Server đang chạy...', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Lỗi server:', err);
  res.status(500).json({ error: 'Lỗi server nội bộ', detail: err.message });
});

// Chạy server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
