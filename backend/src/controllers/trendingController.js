const { getClient, isConnected } = require('../config/redis');
const CarModel = require('../models/carModel');

const KEY_ALLTIME = 'cars:views:alltime';
const DAILY_TTL   = 60 * 60 * 24 * 30; // 30 days

function dailyKey(date) {
  return `cars:views:daily:${date}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const trendingController = {
  // POST /api/cars/:id/click  (public)
  async trackClick(req, res) {
    const carId = String(parseInt(req.params.id));
    if (!carId || carId === 'NaN') {
      return res.status(400).json({ success: false, message: 'Invalid car id' });
    }

    if (!isConnected()) {
      return res.json({ success: true, tracked: false });
    }

    try {
      const redis = getClient();
      const today = todayStr();
      const dKey  = dailyKey(today);

      await Promise.all([
        redis.zincrby(KEY_ALLTIME, 1, carId),
        redis.zincrby(dKey, 1, carId),
        redis.expire(dKey, DAILY_TTL),
      ]);

      res.json({ success: true, tracked: true });
    } catch (err) {
      // non-fatal — never break the site over analytics
      console.warn('[Trending] trackClick error:', err.message);
      res.json({ success: true, tracked: false });
    }
  },

  // GET /api/cars/trending?period=7d&limit=8  (public)
  async getTrending(req, res) {
    const limit  = Math.min(parseInt(req.query.limit) || 8, 20);
    const period = req.query.period || '7d'; // alltime | today | 7d

    if (!isConnected()) {
      return res.json({ success: true, data: [], redis: false });
    }

    try {
      const redis = getClient();
      let ids = [];

      if (period === 'alltime') {
        ids = await redis.zrevrange(KEY_ALLTIME, 0, limit - 1, 'WITHSCORES');
      } else if (period === 'today') {
        ids = await redis.zrevrange(dailyKey(todayStr()), 0, limit - 1, 'WITHSCORES');
      } else {
        // 7-day window: union last 7 daily keys into a temp key
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return dailyKey(d.toISOString().slice(0, 10));
        });
        const tempKey = `cars:views:tmp:7d:${Date.now()}`;
        await redis.zunionstore(tempKey, days.length, ...days);
        await redis.expire(tempKey, 60); // temp key lives 60s
        ids = await redis.zrevrange(tempKey, 0, limit - 1, 'WITHSCORES');
        redis.del(tempKey).catch(() => {});
      }

      // ids is a flat array: [id, score, id, score, ...]
      const pairs = [];
      for (let i = 0; i < ids.length; i += 2) {
        pairs.push({ id: parseInt(ids[i]), views: parseInt(ids[i + 1]) });
      }

      if (!pairs.length) return res.json({ success: true, data: [] });

      // Enrich with MySQL car data
      const cars = await Promise.all(
        pairs.map(async ({ id, views }) => {
          try {
            const car = await CarModel.getById(id);
            if (!car || car.status !== 'available') return null;
            return { ...car, views };
          } catch {
            return null;
          }
        })
      );

      res.json({ success: true, data: cars.filter(Boolean) });
    } catch (err) {
      console.warn('[Trending] getTrending error:', err.message);
      res.json({ success: true, data: [], error: err.message });
    }
  },

  // GET /api/cars/:id/views  — get view count for a single car (admin)
  async getViews(req, res) {
    const carId = String(parseInt(req.params.id));
    if (!isConnected()) return res.json({ success: true, alltime: 0, today: 0 });

    try {
      const redis = getClient();
      const [alltime, today] = await Promise.all([
        redis.zscore(KEY_ALLTIME, carId),
        redis.zscore(dailyKey(todayStr()), carId),
      ]);
      res.json({ success: true, alltime: parseInt(alltime || 0), today: parseInt(today || 0) });
    } catch {
      res.json({ success: true, alltime: 0, today: 0 });
    }
  },
};

module.exports = trendingController;
