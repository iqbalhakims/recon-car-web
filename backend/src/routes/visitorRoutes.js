const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { track, getStats, getHistory } = require('../controllers/visitorController');

router.post('/track', track);
router.get('/stats', requireAuth, getStats);
router.get('/history', requireAuth, getHistory);

module.exports = router;
