const Redis = require('ioredis');

let client = null;
let connected = false;

function getClient() {
  if (client) return client;

  client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: (times) => {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 200, 1000);
    },
  });

  client.on('connect', () => {
    connected = true;
    console.log('[Redis] Connected');
  });

  client.on('error', (err) => {
    connected = false;
    console.warn('[Redis] Unavailable — trending features will be skipped:', err.message);
  });

  client.on('close', () => {
    connected = false;
  });

  client.connect().catch(() => {}); // non-fatal

  return client;
}

function isConnected() {
  return connected;
}

module.exports = { getClient, isConnected };
