const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Public routes (không cần token)
router.post('/register',        ctrl.register);
router.post('/login',           ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password',  ctrl.resetPassword);

// Protected routes (cần token)
router.get('/me',               authMiddleware, ctrl.me);

// Admin only
router.put('/change-role/:id',  authMiddleware, adminOnly, ctrl.changeRole);

module.exports = router;
