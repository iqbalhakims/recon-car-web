const pool = require('../config/database');

const customerController = {
  async getProfile(req, res) {
    try {
      const { token } = req.params;

      const [leads] = await pool.query(
        `SELECT l.id, l.name, l.phone, l.email, l.status, l.created_at,
                c.model as car_model, c.price as car_price, c.ref_no as car_ref
         FROM leads l
         LEFT JOIN cars c ON l.car_id = c.id
         WHERE l.profile_token = ?`,
        [token]
      );

      if (!leads.length) {
        return res.status(404).json({ success: false, message: 'Profile not found.' });
      }

      const lead = leads[0];

      const [appointments] = await pool.query(
        `SELECT id, appointment_date, notes, status, created_at
         FROM appointments
         WHERE lead_id = ?
         ORDER BY appointment_date DESC`,
        [lead.id]
      );

      res.json({ success: true, data: { lead, appointments } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = customerController;
