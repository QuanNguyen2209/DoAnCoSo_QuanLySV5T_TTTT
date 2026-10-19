const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/eventController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const multer = require('multer');

// Cấu hình multer lưu file vào memory để upload thẳng lên Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Public — danh sách sự kiện (cần đăng nhập để xem my_registration)
router.get('/',    authMiddleware, ctrl.getAll);
router.get('/:id', authMiddleware, ctrl.getById);

// Admin — Upload banner ảnh sự kiện lên Supabase Storage
router.post('/upload-banner', authMiddleware, adminOnly, upload.single('banner'), ctrl.uploadBanner);

// Admin — CRUD sự kiện
router.post('/',   authMiddleware, adminOnly, ctrl.create);
router.put('/:id', authMiddleware, adminOnly, ctrl.update);
router.delete('/:id', authMiddleware, adminOnly, ctrl.remove);

// Admin — Quản lý điểm danh
router.post('/:id/generate-attendance-code', authMiddleware, adminOnly, ctrl.generateAttendanceCode);
router.post('/:id/close-attendance',         authMiddleware, adminOnly, ctrl.closeAttendance);
router.get('/:id/attendance-list',           authMiddleware, adminOnly, ctrl.getAttendanceList);

// Student — Đăng ký & Điểm danh
router.post('/:id/register',              authMiddleware, ctrl.register);
router.post('/:id/cancel-registration',   authMiddleware, ctrl.cancelRegistration);
router.post('/:id/check-in',              authMiddleware, ctrl.checkIn);

module.exports = router;
