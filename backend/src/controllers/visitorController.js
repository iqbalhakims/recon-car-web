const pool = require('../config/database');

exports.track = async (req, res) => {
  const { session_id } = req.body;
  if (!session_id || typeof session_id !== 'string' || !/^[0-9a-f-]{36}$/.test(session_id)) {
    return res.status(400).json({ success: false });
  }
  await pool.query(
    `INSERT INTO visitor_sessions (session_id) VALUES (?)
     ON DUPLICATE KEY UPDATE last_seen = CURRENT_TIMESTAMP`,
    [session_id]
  );
  res.json({ success: true });
};

exports.getStats = async (_req, res) => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM visitor_sessions');
  const [[{ today }]] = await pool.query(
    "SELECT COUNT(*) AS today FROM visitor_sessions WHERE DATE(first_seen) = CURDATE()"
  );
  const [[{ this_week }]] = await pool.query(
    "SELECT COUNT(*) AS this_week FROM visitor_sessions WHERE first_seen >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
  );
  const [[{ this_month }]] = await pool.query(
    "SELECT COUNT(*) AS this_month FROM visitor_sessions WHERE first_seen >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)"
  );
  res.json({ success: true, data: { total, today, this_week, this_month } });
};
