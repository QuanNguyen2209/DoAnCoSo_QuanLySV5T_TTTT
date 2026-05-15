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

// Gửi email cho sinh viên
router.post('/applications/:id/send-email', ctrl.sendEmailToStudent);

// Thống kê
router.get('/stats', ctrl.getStats);

// Danh sách lớp được phân công
router.get('/assigned-classes', ctrl.getAssignedClasses);

// --- ADMIN ROUTES ---
router.get('/admin/all-assignments', ctrl.getAllAssignments);
router.get('/admin/reviewers', ctrl.getAllReviewers);
router.post('/admin/assignments', ctrl.createAssignment);
router.delete('/admin/assignments/:id', ctrl.deleteAssignment);

module.exports = router;
