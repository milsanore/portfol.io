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
  const portfolioRes = http.post(
    `${BASE_URL}/portfolios`,
    JSON.stringify({ customer_id: crypto.randomUUID(), name: 'Load Test Portfolio', currency: 'AUD' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const portfolioId = portfolioRes.json('id');

  for (let i = 0; i < 5; i++) {
    http.post(
      `${BASE_URL}/portfolios/${portfolioId}/transactions`,
      JSON.stringify({ ticker: 'CBA.ASX', side: 'buy', amount: i + 1, price: 100.5, currency: 'AUD' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  return { portfolioId };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/portfolios/${data.portfolioId}/transactions`);
  check(res, {
    'list: status is 200': (r) => r.status === 200,
    'list: has data': (r) => Array.isArray(r.json('data')),
  });
}
