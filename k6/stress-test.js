import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const loginDuration = new Trend('login_duration', true);
const carsDuration = new Trend('cars_duration', true);
const leadsDuration = new Trend('leads_duration', true);
const errorRate = new Rate('error_rate');
const totalRequests = new Counter('total_requests');

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const LOGIN_EMAIL = __ENV.LOGIN_EMAIL || 'admin@example.com';
const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || 'password123';

// ── Stress test stages ────────────────────────────────────────────────────────
// Ramp up → sustain peak → ramp down
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // warm-up: ramp to 10 VUs
    { duration: '1m',  target: 50 },   // ramp to 50 VUs
    { duration: '2m',  target: 100 },  // stress: ramp to 100 VUs
    { duration: '1m',  target: 100 },  // hold peak
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed:   ['rate<0.05'],   // error rate under 5%
    error_rate:        ['rate<0.05'],
    login_duration:    ['p(95)<1500'],
    cars_duration:     ['p(95)<1000'],
    leads_duration:    ['p(95)<1000'],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function headers(token = null) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function ok(res, label) {
  const passed = check(res, {
    [`${label}: status 2xx`]: (r) => r.status >= 200 && r.status < 300,
    [`${label}: body not empty`]: (r) => r.body && r.body.length > 0,
  });
  errorRate.add(!passed);
  totalRequests.add(1);
  return passed;
}

// ── Scenario: authenticate and exercise the API ───────────────────────────────
export default function () {
  let token = null;

  // ── 1. Health check ──────────────────────────────────────────────────────
  group('health', () => {
    const res = http.get(`${BASE_URL}/health`);
    ok(res, 'health');
  });

  sleep(0.2);

  // ── 2. Login ─────────────────────────────────────────────────────────────
  group('auth', () => {
    const payload = JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD });
    const res = http.post(`${BASE_URL}/api/auth/login`, payload, { headers: headers() });

    loginDuration.add(res.timings.duration);

    const passed = ok(res, 'login');
    if (passed) {
      const body = res.json();
      token = body.token || body.data?.token || null;
    }
  });

  if (!token) {
    // Cannot proceed without a valid token — count as error and move on
    errorRate.add(1);
    sleep(1);
    return;
  }

  sleep(0.3);

  // ── 3. Cars ──────────────────────────────────────────────────────────────
  group('cars', () => {
    // List cars
    const listRes = http.get(`${BASE_URL}/api/cars`, { headers: headers(token) });
    carsDuration.add(listRes.timings.duration);
    ok(listRes, 'GET /api/cars');

    // Parse a car id if available, for follow-up requests
    let carId = null;
    try {
      const body = listRes.json();
      const cars = Array.isArray(body) ? body : body.data;
      if (cars && cars.length > 0) carId = cars[0].id;
    } catch (_) {}

    if (carId) {
      // Get images for the first car
      const imgRes = http.get(`${BASE_URL}/api/cars/${carId}/images`, { headers: headers(token) });
      carsDuration.add(imgRes.timings.duration);
      ok(imgRes, `GET /api/cars/${carId}/images`);
    }
  });

  sleep(0.3);

  // ── 4. Leads ─────────────────────────────────────────────────────────────
  group('leads', () => {
    // List leads
    const listRes = http.get(`${BASE_URL}/api/leads`, { headers: headers(token) });
    leadsDuration.add(listRes.timings.duration);
    ok(listRes, 'GET /api/leads');

    // Create a lead
    const newLead = JSON.stringify({
      name: `k6-test-${__VU}-${__ITER}`,
      phone: `01${Math.floor(Math.random() * 900000000 + 100000000)}`,
      email: `k6_${__VU}_${__ITER}@test.com`,
      source: 'stress-test',
      car_interest: 'Test Car',
      notes: 'Created by k6 stress test',
    });
    const createRes = http.post(`${BASE_URL}/api/leads`, newLead, { headers: headers(token) });
    leadsDuration.add(createRes.timings.duration);
    ok(createRes, 'POST /api/leads');

    // Update the newly created lead if we got an id back
    let leadId = null;
    try {
      const body = createRes.json();
      leadId = body.id || body.data?.id || body.insertId || null;
    } catch (_) {}

    if (leadId) {
      const updateRes = http.patch(
        `${BASE_URL}/api/leads/${leadId}`,
        JSON.stringify({ status: 'contacted' }),
        { headers: headers(token) }
      );
      leadsDuration.add(updateRes.timings.duration);
      ok(updateRes, `PATCH /api/leads/${leadId}`);
    }
  });

  sleep(0.5);

  // ── 5. Token verify ───────────────────────────────────────────────────────
  group('verify', () => {
    const res = http.get(`${BASE_URL}/api/auth/verify`, { headers: headers(token) });
    ok(res, 'GET /api/auth/verify');
  });

  sleep(1);
}
