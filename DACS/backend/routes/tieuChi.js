const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tieuChiController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',       ctrl.getAll);     // Trả về cây cha-con
router.get('/flat',   ctrl.getFlat);    // Trả về danh sách phẳng
router.get('/:id',    ctrl.getById);
router.post('/',      adminOnly, ctrl.create);
router.put('/:id',    adminOnly, ctrl.update);
router.delete('/:id', adminOnly, ctrl.remove);

module.exports = router;
