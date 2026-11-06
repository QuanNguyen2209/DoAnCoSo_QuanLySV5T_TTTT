const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/pdfController');

// Cả sinh viên, cán bộ và admin đều có thể xuất PDF
router.get('/ho-so/:id', authMiddleware, ctrl.exportHoSo);

module.exports = router;
