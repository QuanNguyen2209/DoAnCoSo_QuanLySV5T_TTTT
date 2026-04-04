const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hoSoController');

router.get('/',                         ctrl.getAll);
router.get('/stats/:sinh_vien_id',      ctrl.getStats);
router.get('/:id',                      ctrl.getById);
router.post('/',                        ctrl.create);
router.put('/:id',                      ctrl.update);
router.post('/:id/submit',              ctrl.submit);
router.delete('/:id',                   ctrl.remove);

module.exports = router;
