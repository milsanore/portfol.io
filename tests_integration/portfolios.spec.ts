import { randomUUID } from 'crypto';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

const customerId = randomUUID();
const otherCustomerId = randomUUID();

async function createPortfolio(payload: {
  customer_id: string;
  name: string;
  currency: string;
}) {
  const response = await fetch(`${BASE_URL}/portfolios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: await response.json() };
}

describe('POST /portfolios', () => {
  it('creates a portfolio and returns 201', async () => {
    const { status, body } = await createPortfolio({
      customer_id: customerId,
      name: 'Integration Test Portfolio',
      currency: 'AUD',
    });

    expect(status).toBe(201);
    expect(body).toMatchObject({
      customer_id: customerId,
      name: 'Integration Test Portfolio',
      currency: 'AUD',
    });
    expect(body.id).toBeDefined();
    expect(body.created_at).toBeDefined();
    expect(body.updated_at).toBeDefined();
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await fetch(`${BASE_URL}/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Missing Fields' }),
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 when currency is missing', async () => {
    const response = await fetch(`${BASE_URL}/portfolios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId, name: 'No Currency' }),
    });

    expect(response.status).toBe(400);
  });
});

describe('GET /portfolios/:id', () => {
  let portfolioId: string;

  beforeAll(async () => {
    const { body } = await createPortfolio({
      customer_id: customerId,
      name: 'Get Test Portfolio',
      currency: 'USD',
    });
    portfolioId = body.id;
  });

  it('returns 200 with the portfolio', async () => {
    const response = await fetch(`${BASE_URL}/portfolios/${portfolioId}`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: portfolioId,
      customer_id: customerId,
      name: 'Get Test Portfolio',
      currency: 'USD',
    });
  });

  it('returns 404 for a non-existent portfolio', async () => {
    const response = await fetch(
      `${BASE_URL}/portfolios/00000000-0000-0000-0000-000000000000`,
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Portfolio not found' });
  });
});

describe('PATCH /portfolios/:id', () => {
  let portfolioId: string;

  beforeAll(async () => {
    const { body } = await createPortfolio({
      customer_id: customerId,
      name: 'Update Test Portfolio',
      currency: 'GBP',
    });
    portfolioId = body.id;
  });

  it('returns 200 with updated name', async () => {
    const response = await fetch(`${BASE_URL}/portfolios/${portfolioId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Renamed Portfolio' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: portfolioId,
      name: 'Renamed Portfolio',
      currency: 'GBP',
    });
  });

  it('returns 200 with updated currency', async () => {
    const response = await fetch(`${BASE_URL}/portfolios/${portfolioId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currency: 'EUR' }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.currency).toBe('EUR');
    expect(body.updated_at).toBeDefined();
  });

  it('returns 404 for a non-existent portfolio', async () => {
    const response = await fetch(
      `${BASE_URL}/portfolios/00000000-0000-0000-0000-000000000000`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Ghost' }),
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Portfolio not found' });
  });
});

describe('GET /portfolios', () => {
  let createdIds: string[] = [];

  beforeAll(async () => {
    const results = await Promise.all([
      createPortfolio({ customer_id: customerId, name: 'List Portfolio A', currency: 'AUD' }),
      createPortfolio({ customer_id: customerId, name: 'List Portfolio B', currency: 'USD' }),
      createPortfolio({ customer_id: otherCustomerId, name: 'Other Customer Portfolio', currency: 'GBP' }),
    ]);
    createdIds = results.map((r) => r.body.id);
  });

  it('returns 200 with a list of portfolios', async () => {
    const response = await fetch(`${BASE_URL}/portfolios`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(3);
    expect(body.page).toBe(1);
    expect(body.page_size).toBe(20);
  });

  it('filters by customer_id', async () => {
    const response = await fetch(`${BASE_URL}/portfolios?customer_id=${customerId}`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.length).toBeGreaterThanOrEqual(2);
    expect(body.data.every((p: { customer_id: string }) => p.customer_id === customerId)).toBe(true);
  });

  it('supports pagination', async () => {
    const response = await fetch(`${BASE_URL}/portfolios?customer_id=${customerId}&page=1&page_size=2`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(1);
    expect(body.page_size).toBe(2);
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  it('returns second page of results', async () => {
    const [page1, page2] = await Promise.all([
      fetch(`${BASE_URL}/portfolios?customer_id=${customerId}&page=1&page_size=2`).then((r) => r.json()),
      fetch(`${BASE_URL}/portfolios?customer_id=${customerId}&page=2&page_size=2`).then((r) => r.json()),
    ]);

    const page1Ids = page1.data.map((p: { id: string }) => p.id);
    const page2Ids = page2.data.map((p: { id: string }) => p.id);
    expect(page1Ids.filter((id: string) => page2Ids.includes(id))).toHaveLength(0);
  });
});
