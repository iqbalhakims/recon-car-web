const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_supersecret';

// Called once at startup — creates users table if missing, then seeds admin
async function seedAdmin() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','staff') DEFAULT 'staff',
      perm_view   TINYINT(1) DEFAULT 1,
      perm_create TINYINT(1) DEFAULT 0,
      perm_edit   TINYINT(1) DEFAULT 0,
      perm_delete TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const [[existing]] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
  if (!existing) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, password_hash, role, perm_view, perm_create, perm_edit, perm_delete) VALUES (?, ?, "admin", 1, 1, 1, 1)',
      [username, hash]
    );
    console.log(`Admin user "${username}" seeded into users table`);
  }
}

function makeToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      perm_view:   !!user.perm_view,
      perm_create: !!user.perm_create,
      perm_edit:   !!user.perm_edit,
      perm_delete: !!user.perm_delete,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

const authController = {
  seedAdmin,

  async login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }
    const [[user]] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.perm_view) {
      return res.status(403).json({ success: false, message: 'Your account does not have view access' });
    }

    res.json({ success: true, token: makeToken(user) });
  },

  verify(req, res) {
    res.json({
      success: true,
      username: req.user.username,
      role: req.user.role,
      perms: {
        view:   req.user.perm_view,
        create: req.user.perm_create,
        edit:   req.user.perm_edit,
        delete: req.user.perm_delete,
      },
    });
  },
};

module.exports = authController;
