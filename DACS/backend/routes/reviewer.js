const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewerController');
const { authMiddleware, adminOnly, staffOnly } = require('../middleware/auth');

// Tất cả route yêu cầu đăng nhập
router.use(authMiddleware);

// --- ADMIN ROUTES ---
router.get('/admin/all-assignments',    adminOnly, ctrl.getAllAssignments);
router.get('/admin/reviewers',          adminOnly, ctrl.getAllReviewers);
router.post('/admin/assignments',       adminOnly, ctrl.createAssignment);
router.delete('/admin/assignments/:id', adminOnly, ctrl.deleteAssignment);

// --- CÁN BỘ XÉT DUYỆT (can_bo / admin) ---
router.use(staffOnly);

router.get('/applications',                 ctrl.getAssignedApplications);
router.get('/applications/:id',             ctrl.getApplicationDetail);
router.put('/applications/:id/review',      ctrl.reviewApplication);
router.post('/applications/:id/send-email', ctrl.sendEmailToStudent);
router.get('/stats',                        ctrl.getStats);
router.get('/assigned-classes',             ctrl.getAssignedClasses);

module.exports = router;
