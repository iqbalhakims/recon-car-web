const express = require('express');
const router = express.Router({ mergeParams: true });
const { imageUpload } = require('../middleware/upload');
const imageController = require('../controllers/imageController');

router.get('/', imageController.getImages);
router.post('/', imageUpload.single('image'), imageController.upload);
router.delete('/:imageId', imageController.delete);

module.exports = router;
