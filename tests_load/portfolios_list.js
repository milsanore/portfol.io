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

export function setup() {
  const customerId = crypto.randomUUID();
  http.post(
    `${BASE_URL}/portfolios`,
    JSON.stringify({ customer_id: customerId, name: 'Load Test Portfolio', currency: 'USD' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return { customerId };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/portfolios?customer_id=${data.customerId}`);
  check(res, {
    'list: status is 200': (r) => r.status === 200,
    'list: has data': (r) => Array.isArray(r.json('data')),
  });
}
