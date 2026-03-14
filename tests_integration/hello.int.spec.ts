const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

describe('GET /hello', () => {
  it('returns 200 with hello world message', async () => {
    const response = await fetch(`${BASE_URL}/hello`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'Hello, World!' });
  });
});
