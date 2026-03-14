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
  const createRes = http.post(
    `${BASE_URL}/portfolios`,
    JSON.stringify({ customer_id: crypto.randomUUID(), name: 'Load Test Portfolio', currency: 'USD' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const id = createRes.json('id');
  if (!id) return;

  const res = http.patch(
    `${BASE_URL}/portfolios/${id}`,
    JSON.stringify({ name: 'Updated Portfolio' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, {
    'update: status is 200': (r) => r.status === 200,
    'update: name changed': (r) => r.json('name') === 'Updated Portfolio',
  });
}
