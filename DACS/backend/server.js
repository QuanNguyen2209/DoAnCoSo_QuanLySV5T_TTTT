const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cấu hình môi trường
dotenv.config();

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
const kyXetDuyetRoutes  = require('./routes/kyXetDuyet');
const tieuChiRoutes     = require('./routes/tieuChi');
const hoSoRoutes        = require('./routes/hoSo');
const minhChungRoutes   = require('./routes/minhChung');
const userRoutes        = require('./routes/users');

app.use('/api/ky-xet-duyet', kyXetDuyetRoutes);
app.use('/api/tieu-chi',     tieuChiRoutes);
app.use('/api/ho-so',        hoSoRoutes);
app.use('/api/minh-chung',   minhChungRoutes);
app.use('/api/users',        userRoutes);

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
