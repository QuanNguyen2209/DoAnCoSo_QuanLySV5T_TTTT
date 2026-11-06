const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hoSoController');
const { authMiddleware } = require('../middleware/auth');

// Tất cả thao tác hồ sơ đều cần đăng nhập (quyền sở hữu kiểm tra trong controller)
router.use(authMiddleware);

router.get('/',                         ctrl.getAll);
router.get('/stats/:sinh_vien_id',      ctrl.getStats);
router.get('/:id',                      ctrl.getById);
router.post('/',                        ctrl.create);
router.put('/:id',                      ctrl.update);
router.post('/:id/submit',              ctrl.submit);
router.delete('/:id',                   ctrl.remove);

module.exports = router;
