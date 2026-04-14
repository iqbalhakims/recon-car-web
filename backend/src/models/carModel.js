const pool = require('../config/database');

async function migrate() {
  const db = process.env.DB_NAME || 'carcrm';
  const [cols] = await pool.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cars'",
    [db]
  );
  const existing = cols.map(c => c.COLUMN_NAME);
  if (!existing.includes('year'))   await pool.query("ALTER TABLE cars ADD COLUMN year INT AFTER `condition`");
  if (!existing.includes('grade'))  await pool.query("ALTER TABLE cars ADD COLUMN grade VARCHAR(50) AFTER year");
  if (!existing.includes('ref_no')) await pool.query("ALTER TABLE cars ADD COLUMN ref_no VARCHAR(10) UNIQUE AFTER id");

  // Backfill ref_no for existing cars that don't have one
  const [missing] = await pool.query("SELECT id FROM cars WHERE ref_no IS NULL OR ref_no = ''");
  for (const row of missing) {
    const ref = `REF-${String(row.id).padStart(4, '0')}`;
    await pool.query("UPDATE cars SET ref_no = ? WHERE id = ?", [ref, row.id]);
  }
}
migrate().catch(err => console.error('Migration error:', err.message));

const CarModel = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM cars ORDER BY created_at DESC');
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM cars WHERE id = ?', [id]);
    return rows[0];
  },

  async create({ model, price, mileage, condition, year, grade }) {
    const [result] = await pool.query(
      'INSERT INTO cars (model, price, mileage, `condition`, year, grade) VALUES (?, ?, ?, ?, ?, ?)',
      [model, price, mileage, condition, year || null, grade || null]
    );
    const insertId = result.insertId;
    const ref_no = `REF-${String(insertId).padStart(4, '0')}`;
    await pool.query('UPDATE cars SET ref_no = ? WHERE id = ?', [ref_no, insertId]);
    return insertId;
  },

  async update(id, { model, price, mileage, condition, year, grade }) {
    const [result] = await pool.query(
      'UPDATE cars SET model=?, price=?, mileage=?, `condition`=?, year=?, grade=? WHERE id=?',
      [model, price, mileage || null, condition || null, year || null, grade || null, id]
    );
    return result.affectedRows;
  },

  async updateStatus(id, status) {
    const [result] = await pool.query(
      'UPDATE cars SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM cars WHERE id = ?', [id]);
    return result.affectedRows;
  },
};

module.exports = CarModel;
