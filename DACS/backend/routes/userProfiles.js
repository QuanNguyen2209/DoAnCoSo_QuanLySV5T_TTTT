const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { authMiddleware } = require('../middleware/auth');

// Route yêu cầu đăng nhập
router.use(authMiddleware);

// Lấy hồ sơ của user hiện tại
router.get('/me', userProfileController.getProfile);

// Cập nhật/Tạo mới hồ sơ của user hiện tại
router.put('/me', userProfileController.upsertProfile);

module.exports = router;
