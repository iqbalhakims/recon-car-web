const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { list, create, updatePerms, remove } = require('../controllers/userController');

router.get('/', requireAuth, requireAdmin, list);
router.post('/', requireAuth, requireAdmin, create);
router.patch('/:id/perms', requireAuth, requireAdmin, updatePerms);
router.delete('/:id', requireAuth, requireAdmin, remove);

module.exports = router;
