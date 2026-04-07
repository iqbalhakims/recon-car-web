const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.post('/generate', messageController.generate);

module.exports = router;
