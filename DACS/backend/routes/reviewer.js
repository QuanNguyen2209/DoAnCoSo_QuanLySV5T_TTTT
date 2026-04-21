const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewerController');
const { authMiddleware } = require('../middleware/auth');

// Tất cả route yêu cầu đăng nhập
router.use(authMiddleware);

// Danh sách hồ sơ được phân công
router.get('/applications', ctrl.getAssignedApplications);

// Chi tiết 1 hồ sơ
router.get('/applications/:id', ctrl.getApplicationDetail);

// Duyệt/Từ chối hồ sơ
router.put('/applications/:id/review', ctrl.reviewApplication);

// Thống kê
router.get('/stats', ctrl.getStats);

// Danh sách lớp được phân công
router.get('/assigned-classes', ctrl.getAssignedClasses);

module.exports = router;
