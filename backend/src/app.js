const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const carRoutes = require('./routes/carRoutes');
const leadRoutes = require('./routes/leadRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const requireAuth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public: auth + customer-facing reads
app.use('/api/auth', authRoutes);

// Selectively protect: GET /api/cars* is public, everything else requires auth
app.use('/api', (req, res, next) => {
  const isPublicRead =
    req.method === 'GET' &&
    (req.path === '/cars' || req.path.match(/^\/cars\/\d+\/images$/));
  if (isPublicRead) return next();
  return requireAuth(req, res, next);
});

app.use('/api/cars', carRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/messages', messageRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Car Sales CRM API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
