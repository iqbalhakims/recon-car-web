/**
 * Smoke test — very low load, just validates the API is reachable
 * Run: k6 run k6/smoke-test.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const LOGIN_EMAIL = __ENV.LOGIN_EMAIL || 'admin@example.com';
const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || 'password123';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed:   ['rate<0.01'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  // Health
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health ok': (r) => r.status === 200 });

  // Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  const loginOk = check(loginRes, { 'login 2xx': (r) => r.status >= 200 && r.status < 300 });
  if (!loginOk) return;

  const body = loginRes.json();
  const token = body.token || body.data?.token;
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // Cars list
  const cars = http.get(`${BASE_URL}/api/cars`, authHeader);
  check(cars, { 'cars list 2xx': (r) => r.status >= 200 && r.status < 300 });

  // Leads list
  const leads = http.get(`${BASE_URL}/api/leads`, authHeader);
  check(leads, { 'leads list 2xx': (r) => r.status >= 200 && r.status < 300 });

  sleep(1);
}
