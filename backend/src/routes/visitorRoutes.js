const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { track, getStats } = require('../controllers/visitorController');

router.post('/track', track);
router.get('/stats', requireAuth, getStats);

module.exports = router;
