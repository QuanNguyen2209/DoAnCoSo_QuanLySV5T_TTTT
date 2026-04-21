const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/minhChungController');

router.get('/',              ctrl.getByHoSo);
router.post('/',             ctrl.create);
router.post('/upload-url',   ctrl.getUploadUrl);
router.post('/upsert-criteria', ctrl.upsertForCriteria);
router.put('/:id',           ctrl.update);
router.delete('/:id',        ctrl.remove);

// Multi-file endpoints
router.post('/:id/files',        ctrl.addFile);
router.delete('/files/:fileId',  ctrl.removeFile);

module.exports = router;
