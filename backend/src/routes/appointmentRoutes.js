const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

router.get('/lead/:leadId', appointmentController.getByLead);
router.post('/', appointmentController.create);
router.patch('/:id/status', appointmentController.updateStatus);
router.delete('/:id', appointmentController.delete);

module.exports = router;
