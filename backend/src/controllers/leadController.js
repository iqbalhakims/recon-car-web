const LeadModel = require('../models/leadModel');

const leadController = {
  async getAll(req, res) {
    try {
      const leads = await LeadModel.getAll();
      res.json({ success: true, data: leads });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { name, phone, car_id, next_follow_up_date } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'name and phone are required' });
      }
      const id = await LeadModel.create({ name, phone, car_id, next_follow_up_date });
      const lead = await LeadModel.getById(id);
      res.status(201).json({ success: true, data: lead });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { status, next_follow_up_date } = req.body;
      const affected = await LeadModel.update(id, { status, next_follow_up_date });
      if (!affected) {
        return res.status(404).json({ success: false, message: 'Lead not found' });
      }
      res.json({ success: true, message: 'Lead updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = leadController;
