const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/kyXetDuyetController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',        ctrl.getAll);
router.get('/active',  ctrl.getActive);
router.get('/:id',     ctrl.getById);
router.post('/',       adminOnly, ctrl.create);
router.put('/:id',     adminOnly, ctrl.update);
router.delete('/:id',  adminOnly, ctrl.remove);

module.exports = router;
