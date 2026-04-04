const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/minhChungController');

router.get('/',              ctrl.getByHoSo);
router.post('/',             ctrl.create);
router.post('/upload-url',   ctrl.getUploadUrl);
router.put('/:id',           ctrl.update);
router.delete('/:id',        ctrl.remove);

module.exports = router;
