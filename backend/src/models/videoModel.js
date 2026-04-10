const pool = require('../config/database');

const VideoModel = {
  async getByCarId(car_id) {
    const [rows] = await pool.query(
      'SELECT * FROM car_videos WHERE car_id = ? ORDER BY created_at DESC',
      [car_id]
    );
    return rows;
  },

  async create(car_id, filename) {
    const [result] = await pool.query(
      'INSERT INTO car_videos (car_id, filename) VALUES (?, ?)',
      [car_id, filename]
    );
    return result.insertId;
  },

  async delete(id) {
    const [rows] = await pool.query('SELECT filename FROM car_videos WHERE id = ?', [id]);
    if (!rows[0]) return null;
    await pool.query('DELETE FROM car_videos WHERE id = ?', [id]);
    return rows[0].filename;
  },
};

module.exports = VideoModel;
