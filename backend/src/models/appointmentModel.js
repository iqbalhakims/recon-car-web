const pool = require('../config/database');

const AppointmentModel = {
  async getByLead(leadId) {
    const [rows] = await pool.query(
      'SELECT * FROM appointments WHERE lead_id = ? ORDER BY appointment_date DESC',
      [leadId]
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM appointments WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ lead_id, appointment_date, notes }) {
    const [result] = await pool.query(
      'INSERT INTO appointments (lead_id, appointment_date, notes) VALUES (?, ?, ?)',
      [lead_id, appointment_date, notes || null]
    );
    return result.insertId;
  },

  async updateStatus(id, status) {
    const [result] = await pool.query(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM appointments WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = AppointmentModel;
