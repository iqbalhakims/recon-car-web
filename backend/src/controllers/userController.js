const bcrypt = require('bcryptjs');
const pool = require('../config/database');

exports.list = async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT id, username, role, perm_view, perm_create, perm_edit, perm_delete, created_at FROM users ORDER BY id'
  );
  res.json({ success: true, data: rows });
};

exports.create = async (req, res) => {
  const { username, password, perm_view = 1, perm_create = 0, perm_edit = 0, perm_delete = 0 } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash, role, perm_view, perm_create, perm_edit, perm_delete) VALUES (?, ?, "staff", ?, ?, ?, ?)',
      [username, hash, perm_view ? 1 : 0, perm_create ? 1 : 0, perm_edit ? 1 : 0, perm_delete ? 1 : 0]
    );
    res.json({ success: true, message: 'User created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }
    throw err;
  }
};

exports.updatePerms = async (req, res) => {
  const { id } = req.params;
  const { perm_view, perm_create, perm_edit, perm_delete } = req.body;

  // Protect the admin account from perm changes
  const [[user]] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role === 'admin') {
    return res.status(403).json({ success: false, message: 'Cannot modify admin permissions' });
  }

  await pool.query(
    'UPDATE users SET perm_view = ?, perm_create = ?, perm_edit = ?, perm_delete = ? WHERE id = ?',
    [perm_view ? 1 : 0, perm_create ? 1 : 0, perm_edit ? 1 : 0, perm_delete ? 1 : 0, id]
  );
  res.json({ success: true, message: 'Permissions updated' });
};

exports.remove = async (req, res) => {
  const { id } = req.params;
  const [[user]] = await pool.query('SELECT role FROM users WHERE id = ?', [id]);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user.role === 'admin') {
    return res.status(403).json({ success: false, message: 'Cannot delete the admin account' });
  }
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  res.json({ success: true, message: 'User deleted' });
};
