const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('../controllers/vinhDanhController');
const { authMiddleware, adminOnly, adminOrCanBo } = require('../middleware/auth');

// Multer: lưu file vào bộ nhớ RAM (buffer) để upload thẳng lên Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file hình ảnh (PNG, JPG...)'));
  },
});

// Tất cả route yêu cầu đăng nhập
router.use(authMiddleware);

// Config vinh danh — chỉ Admin được bật/tắt
router.get('/config', ctrl.getConfig);
router.put('/config', adminOnly, ctrl.updateConfig);


// Danh sách vinh danh (tất cả roles đều xem được)
router.get('/', ctrl.getHonorRoll);

// Thống kê vinh danh
router.get('/stats', ctrl.getHonorStats);

// Lấy mẫu poster hiện tại
router.get('/poster-template', ctrl.getPosterTemplate);

// Upload mẫu poster mới (chỉ admin) — nhận file qua multipart/form-data
router.post('/poster-template', adminOnly, upload.single('file'), ctrl.uploadPosterTemplate);

module.exports = router;
