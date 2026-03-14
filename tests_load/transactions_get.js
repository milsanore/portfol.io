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

  const txRes = http.post(
    `${BASE_URL}/portfolios/${portfolioId}/transactions`,
    JSON.stringify({ unique_symbol: 'ASX:CBA', side: 'buy', amount: 10, price: 100.5, currency: 'AUD' }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  return { portfolioId, transactionId: txRes.json('id') };
}

export default function (data) {
  const res = http.get(
    `${BASE_URL}/portfolios/${data.portfolioId}/transactions/${data.transactionId}`,
  );
  check(res, {
    'get: status is 200': (r) => r.status === 200,
    'get: id matches': (r) => r.json('id') === data.transactionId,
  });
}
