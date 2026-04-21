const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/tieuChiController');

router.get('/',       ctrl.getAll);     // Trả về cây cha-con
router.get('/flat',   ctrl.getFlat);    // Trả về danh sách phẳng
router.get('/:id',    ctrl.getById);
router.post('/',      ctrl.create);
router.put('/:id',    ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
