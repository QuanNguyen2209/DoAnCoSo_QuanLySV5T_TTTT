const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { loginLimiter, registerLimiter, otpLimiter, resetLimiter, changePasswordLimiter } = require('../middleware/rateLimit');

// Public routes (không cần token) — có giới hạn tần suất
router.post('/register',        registerLimiter, ctrl.register);
router.post('/login',           loginLimiter,    ctrl.login);
router.post('/forgot-password', otpLimiter,      ctrl.forgotPassword);
router.post('/reset-password',  resetLimiter,    ctrl.resetPassword);

// Protected routes (cần token)
router.get('/me',               authMiddleware, ctrl.me);
router.post('/change-password', authMiddleware, changePasswordLimiter, ctrl.changePassword);

// Admin only
router.put('/change-role/:id',  authMiddleware, adminOnly, ctrl.changeRole);

module.exports = router;
