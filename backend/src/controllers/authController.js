const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Hash the admin password once at startup for safe comparison
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_supersecret';

const authController = {
  async login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const validUser = username === ADMIN_USERNAME;
    const validPass = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

    if (!validUser || !validPass) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token });
  },

  verify(req, res) {
    res.json({ success: true, username: req.user.username });
  },
};

module.exports = authController;
