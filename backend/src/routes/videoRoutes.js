const express = require('express');
const router = express.Router({ mergeParams: true });
const { videoUpload } = require('../middleware/upload');
const videoController = require('../controllers/videoController');

router.get('/', videoController.getVideos);
router.post('/', videoUpload.single('video'), videoController.upload);
router.delete('/:videoId', videoController.delete);

module.exports = router;
