import http from 'k6/http';
import { check } from 'k6';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1s', target: 20 },
    { duration: '5s', target: 20 },
  ],
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/portfolios`,
    JSON.stringify({ customer_id: crypto.randomUUID(), name: 'Load Test Portfolio', currency: 'USD' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'create: status is 201': (r) => r.status === 201 });
}
