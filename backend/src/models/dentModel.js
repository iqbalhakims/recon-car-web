const pool = require('../config/database');

async function migrateTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_dents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      car_id INT NOT NULL,
      filename VARCHAR(255),
      note VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
    )
  `);
}
migrateTable().catch(err => console.error('Dent table migration error:', err.message));

const DentModel = {
  async getByCarId(car_id) {
    const [rows] = await pool.query(
      'SELECT * FROM car_dents WHERE car_id = ? ORDER BY created_at ASC',
      [car_id]
    );
    return rows;
  },

  async create(car_id, filename, note) {
    const [result] = await pool.query(
      'INSERT INTO car_dents (car_id, filename, note) VALUES (?, ?, ?)',
      [car_id, filename || null, note || null]
    );
    return result.insertId;
  },

  async delete(id) {
    const [rows] = await pool.query('SELECT filename FROM car_dents WHERE id = ?', [id]);
    if (!rows[0]) return null;
    await pool.query('DELETE FROM car_dents WHERE id = ?', [id]);
    return rows[0].filename;
  },
};

module.exports = DentModel;
