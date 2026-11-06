const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lopHocController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',       ctrl.getAll);
router.post('/',      adminOnly, ctrl.create);
router.put('/:id',    adminOnly, ctrl.update);
router.delete('/:id', adminOnly, ctrl.remove);

module.exports = router;
