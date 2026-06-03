const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/usersController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/',        authMiddleware, adminOnly, ctrl.getAll);
router.post('/',       authMiddleware, adminOnly, ctrl.createUser);
router.get('/:id',    authMiddleware, ctrl.getById);
router.put('/:id',    authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, adminOnly, ctrl.deleteUser);

module.exports = router;
