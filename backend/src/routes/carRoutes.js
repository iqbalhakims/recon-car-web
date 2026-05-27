const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { imageUpload, spinImageUpload } = require('../middleware/upload');
const imageController = require('../controllers/imageController');
const spinImageController = require('../controllers/spinImageController');
const trendingController = require('../controllers/trendingController');

// Trending — must be before /:id routes
router.get('/trending', trendingController.getTrending);

router.get('/', carController.getAll);
router.post('/', carController.create);
router.put('/:id', carController.update);
router.patch('/:id/status', carController.updateStatus);
router.delete('/:id', carController.delete);
router.post('/:id/click', trendingController.trackClick);
router.get('/:id/views', trendingController.getViews);

// Image routes
router.get('/:id/images', imageController.getImages);
router.post('/:id/images', imageUpload.single('image'), imageController.upload);
router.delete('/:id/images/:imageId', imageController.delete);

// Dent/scratch routes
const dentController = require('../controllers/dentController');
router.get('/:id/dents', dentController.getDents);
router.post('/:id/dents', imageUpload.single('image'), dentController.upload);
router.delete('/:id/dents/:dentId', dentController.delete);

// 360° spin frame routes
router.get('/:id/spin', spinImageController.getFrames);
router.post('/:id/spin', spinImageUpload.single('image'), spinImageController.upload);
router.delete('/:id/spin/:frameId', spinImageController.delete);

module.exports = router;
