const AppointmentModel = require('../models/appointmentModel');

const appointmentController = {
  async getByLead(req, res) {
    try {
      const data = await AppointmentModel.getByLead(req.params.leadId);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { lead_id, appointment_date, notes } = req.body;
      if (!lead_id || !appointment_date) {
        return res.status(400).json({ success: false, message: 'lead_id and appointment_date are required' });
      }
      const id = await AppointmentModel.create({ lead_id, appointment_date, notes });
      const appointment = await AppointmentModel.getById(id);
      res.status(201).json({ success: true, data: appointment });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ['scheduled', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `status must be one of: ${validStatuses.join(', ')}` });
      }
      const affected = await AppointmentModel.updateStatus(id, status);
      if (!affected) return res.status(404).json({ success: false, message: 'Appointment not found' });
      res.json({ success: true, message: 'Appointment updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      const affected = await AppointmentModel.delete(req.params.id);
      if (!affected) return res.status(404).json({ success: false, message: 'Appointment not found' });
      res.json({ success: true, message: 'Appointment deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = appointmentController;
