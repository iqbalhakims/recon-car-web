const pool = require('../config/database');

const SpinImageModel = {
  async getByCarId(car_id) {
    const [rows] = await pool.query(
      'SELECT * FROM car_spin_images WHERE car_id = ? ORDER BY id ASC',
      [car_id]
    );
    return rows;
  },

  async create(car_id, filename) {
    const [result] = await pool.query(
      'INSERT INTO car_spin_images (car_id, filename) VALUES (?, ?)',
      [car_id, filename]
    );
    return result.insertId;
  },

  async delete(id) {
    const [rows] = await pool.query('SELECT filename FROM car_spin_images WHERE id = ?', [id]);
    if (!rows[0]) return null;
    await pool.query('DELETE FROM car_spin_images WHERE id = ?', [id]);
    return rows[0].filename;
  },
};

module.exports = SpinImageModel;
