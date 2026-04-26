const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/:token', customerController.getProfile);

module.exports = router;
