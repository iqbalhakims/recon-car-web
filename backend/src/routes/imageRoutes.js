const express = require('express');
const router = express.Router({ mergeParams: true });
const upload = require('../middleware/upload');
const imageController = require('../controllers/imageController');

router.get('/', imageController.getImages);
router.post('/', upload.single('image'), imageController.upload);
router.delete('/:imageId', imageController.delete);

module.exports = router;
