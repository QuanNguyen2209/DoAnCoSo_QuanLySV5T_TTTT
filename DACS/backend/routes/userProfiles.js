const express = require('express');
const router = express.Router();
const multer = require('multer');
const userProfileController = require('../controllers/userProfileController');
const { authMiddleware } = require('../middleware/auth');

// Multer config cho avatar
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file hình ảnh (PNG, JPG...)'));
  },
});

// Route yêu cầu đăng nhập
router.use(authMiddleware);

// Lấy hồ sơ của user hiện tại
router.get('/me', userProfileController.getProfile);

// Cập nhật/Tạo mới hồ sơ của user hiện tại
router.put('/me', userProfileController.upsertProfile);

// Upload ảnh đại diện
router.post('/me/avatar', upload.single('avatar'), userProfileController.uploadAvatar);

module.exports = router;
