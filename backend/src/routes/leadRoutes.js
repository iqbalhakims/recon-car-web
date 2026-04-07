const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

router.get('/', leadController.getAll);
router.post('/', leadController.create);
router.patch('/:id', leadController.update);

module.exports = router;
