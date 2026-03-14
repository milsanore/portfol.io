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
  const res = http.post(
    `${BASE_URL}/portfolios`,
    JSON.stringify({ customer_id: crypto.randomUUID(), name: 'Load Test Portfolio', currency: 'AUD' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  return { portfolioId: res.json('id') };
}

export default function (data) {
  const res = http.post(
    `${BASE_URL}/portfolios/${data.portfolioId}/transactions`,
    JSON.stringify({ ticker: 'CBA.ASX', side: 'buy', amount: 10, price: 100.5, currency: 'AUD' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'create: status is 201': (r) => r.status === 201 });
}
