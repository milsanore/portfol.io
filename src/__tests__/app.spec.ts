import { buildApp } from '../app';

describe('GET /hello', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with hello world message', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/hello',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ message: 'Hello, World!' });
  });
});
