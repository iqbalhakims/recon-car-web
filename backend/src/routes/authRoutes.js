const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/verify', requireAuth, authController.verify);

module.exports = router;
