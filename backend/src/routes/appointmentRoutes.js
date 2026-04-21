const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Public routes (no auth required)
router.get('/available', appointmentController.getAvailableSlots);
router.post('/book', appointmentController.publicBook);

// Staff routes
router.get('/lead/:leadId', appointmentController.getByLead);
router.post('/', appointmentController.create);
router.patch('/:id/status', appointmentController.updateStatus);
router.delete('/:id', appointmentController.delete);

module.exports = router;
