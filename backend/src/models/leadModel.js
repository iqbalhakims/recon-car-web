const pool = require('../config/database');

const LeadModel = {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT l.*, c.model as car_model, c.price as car_price
      FROM leads l
      LEFT JOIN cars c ON l.car_id = c.id
      ORDER BY l.created_at DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM leads WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ name, phone, car_id, next_follow_up_date }) {
    const [result] = await pool.query(
      'INSERT INTO leads (name, phone, car_id, next_follow_up_date) VALUES (?, ?, ?, ?)',
      [name, phone, car_id || null, next_follow_up_date || null]
    );
    return result.insertId;
  },

  async update(id, { status, next_follow_up_date }) {
    const [result] = await pool.query(
      'UPDATE leads SET status = ?, next_follow_up_date = ? WHERE id = ?',
      [status, next_follow_up_date || null, id]
    );
    return result.affectedRows;
  },
};

module.exports = LeadModel;
