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

  const symbols = ['ASX:CBA', 'ASX:ANZ', 'ASX:NAB', 'ASX:WBC', 'ASX:BHP'];
  for (const unique_symbol of symbols) {
    http.post(
      `${BASE_URL}/portfolios/${portfolioId}/transactions`,
      JSON.stringify({ unique_symbol, side: 'buy', amount: 100, price: 50, currency: 'AUD' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    http.post(
      `${BASE_URL}/portfolios/${portfolioId}/transactions`,
      JSON.stringify({ unique_symbol, side: 'sell', amount: 20, price: 55, currency: 'AUD' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  return { portfolioId };
}

export default function (data) {
  const res = http.get(`${BASE_URL}/portfolios/${data.portfolioId}/return`);
  check(res, {
    'return: status is 200': (r) => r.status === 200,
    'return: algorithm is SVE': (r) => r.json('algorithm') === 'SVE',
    'return: start_value is positive': (r) => r.json('start_value') > 0,
    'return: has return_pct': (r) => typeof r.json('return_pct') === 'number',
  });
}
