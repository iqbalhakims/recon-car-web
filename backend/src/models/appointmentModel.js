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

  // Returns booked hour strings (e.g. ['09:00', '11:00']) for a given date
  async getBookedSlots(date) {
    const [rows] = await pool.query(
      `SELECT TIME_FORMAT(appointment_date, '%H:00') AS slot
       FROM appointments
       WHERE DATE(appointment_date) = ? AND status = 'scheduled'`,
      [date]
    );
    return rows.map(r => r.slot);
  },

  // Returns true if a scheduled appointment already exists at the same hour slot
  async hasConflict(appointment_date) {
    const [rows] = await pool.query(
      `SELECT id FROM appointments
       WHERE appointment_date = ? AND status = 'scheduled'`,
      [appointment_date]
    );
    return rows.length > 0;
  },
};

module.exports = AppointmentModel;
