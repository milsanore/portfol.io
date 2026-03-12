import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1s', target: 20 },
    { duration: '29s', target: 20 },
  ],
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/hello`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'message is Hello, World!': (r) => r.json('message') === 'Hello, World!',
  });
}
