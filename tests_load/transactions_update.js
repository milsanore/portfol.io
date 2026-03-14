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
  const portfolioRes = http.post(
    `${BASE_URL}/portfolios`,
    JSON.stringify({ customer_id: crypto.randomUUID(), name: 'Load Test Portfolio', currency: 'AUD' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const portfolioId = portfolioRes.json('id');
  if (!portfolioId) return;

  const txRes = http.post(
    `${BASE_URL}/portfolios/${portfolioId}/transactions`,
    JSON.stringify({ ticker: 'CBA.ASX', side: 'buy', amount: 10, price: 100.5, currency: 'AUD' }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  const transactionId = txRes.json('id');
  if (!transactionId) return;

  const res = http.patch(
    `${BASE_URL}/portfolios/${portfolioId}/transactions/${transactionId}`,
    JSON.stringify({ ticker: 'ANZ.ASX', amount: 20 }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, {
    'update: status is 200': (r) => r.status === 200,
    'update: ticker changed': (r) => r.json('ticker') === 'ANZ.ASX',
    'update: amount changed': (r) => r.json('amount') === 20,
  });
}
