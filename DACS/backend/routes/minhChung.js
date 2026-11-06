const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/minhChungController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',                 ctrl.getByHoSo);
router.post('/',                ctrl.create);
router.post('/upload-url',      ctrl.getUploadUrl);
router.post('/upsert-criteria', ctrl.upsertForCriteria);

// Sự kiện đã điểm danh → minh chứng
router.get('/goi-y-su-kien',          ctrl.getEventSuggestions);
router.post('/su-kien',               ctrl.linkEvent);
router.delete('/su-kien/:linkId',     ctrl.unlinkEvent);

// Multi-file endpoints (đặt trước '/:id' cho rõ ràng)
router.delete('/files/:fileId', ctrl.removeFile);
router.post('/:id/files',       ctrl.addFile);

router.put('/:id',              ctrl.update);
router.delete('/:id',           ctrl.remove);

module.exports = router;
