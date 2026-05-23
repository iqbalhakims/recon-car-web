const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/blogController');
const requireAuth = require('../middleware/auth');

// Public
router.get('/', ctrl.listPublished);
router.get('/:slug', ctrl.getBySlug);

// Admin (auth required)
router.get('/admin/all', requireAuth, ctrl.listAll);
router.post('/', requireAuth, ctrl.create);
router.put('/:id', requireAuth, ctrl.update);
router.delete('/:id', requireAuth, ctrl.delete);

module.exports = router;
