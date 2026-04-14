const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { imageUpload } = require('../middleware/upload');
const imageController = require('../controllers/imageController');

router.get('/', carController.getAll);
router.post('/', carController.create);
router.put('/:id', carController.update);
router.patch('/:id/status', carController.updateStatus);
router.delete('/:id', carController.delete);

// Image routes
router.get('/:id/images', imageController.getImages);
router.post('/:id/images', imageUpload.single('image'), imageController.upload);
router.delete('/:id/images/:imageId', imageController.delete);

// Dent/scratch routes
const dentController = require('../controllers/dentController');
router.get('/:id/dents', dentController.getDents);
router.post('/:id/dents', imageUpload.single('image'), dentController.upload);
router.delete('/:id/dents/:dentId', dentController.delete);

module.exports = router;
