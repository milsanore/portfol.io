import { randomUUID } from 'crypto';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

async function createPortfolio() {
  const response = await fetch(`${BASE_URL}/portfolios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: randomUUID(), name: 'Test Portfolio', currency: 'AUD' }),
  });
  return (await response.json()) as { id: string };
}

async function createTransaction(
  portfolioId: string,
  payload: Record<string, unknown> = {},
) {
  const response = await fetch(`${BASE_URL}/portfolios/${portfolioId}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      unique_symbol: 'ASX:CBA',
      side: 'buy',
      amount: 10,
      price: 100.5,
      currency: 'AUD',
      ...payload,
    }),
  });
  return { status: response.status, body: await response.json() };
}

describe('POST /portfolios/:portfolio_id/transactions', () => {
  let portfolioId: string;

  beforeAll(async () => {
    portfolioId = (await createPortfolio()).id;
  });

  it('creates a transaction and returns 201', async () => {
    const { status, body } = await createTransaction(portfolioId);

    expect(status).toBe(201);
    expect(body).toMatchObject({
      portfolio_id: portfolioId,
      unique_symbol: 'ASX:CBA',
      side: 'buy',
      amount: 10,
      price: 100.5,
      currency: 'AUD',
    });
    expect(body.id).toBeDefined();
    expect(body.created_at).toBeDefined();
    expect(body.updated_at).toBeDefined();
  });

  it('creates a transaction with optional fields', async () => {
    const { status, body } = await createTransaction(portfolioId, {
      exchange: 'ASX',
      transaction_id: 'ext-123',
      date: '2024-06-01T00:00:00.000Z',
    });

    expect(status).toBe(201);
    expect(body).toMatchObject({
      exchange: 'ASX',
      transaction_id: 'ext-123',
      date: '2024-06-01T00:00:00.000Z',
    });
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await fetch(`${BASE_URL}/portfolios/${portfolioId}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unique_symbol: 'ASX:CBA' }),
    });

    expect(response.status).toBe(400);
  });

  it('returns 400 for an invalid side value', async () => {
    const response = await fetch(`${BASE_URL}/portfolios/${portfolioId}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unique_symbol: 'ASX:CBA', side: 'hold', amount: 10, price: 100.5, currency: 'AUD' }),
    });

    expect(response.status).toBe(400);
  });
});

describe('GET /portfolios/:portfolio_id/transactions/:id', () => {
  let portfolioId: string;
  let transactionId: string;

  beforeAll(async () => {
    portfolioId = (await createPortfolio()).id;
    const { body } = await createTransaction(portfolioId);
    transactionId = body.id;
  });

  it('returns 200 with the transaction', async () => {
    const response = await fetch(
      `${BASE_URL}/portfolios/${portfolioId}/transactions/${transactionId}`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: transactionId,
      portfolio_id: portfolioId,
      unique_symbol: 'ASX:CBA',
    });
  });

  it('returns 404 for a non-existent transaction', async () => {
    const response = await fetch(
      `${BASE_URL}/portfolios/${portfolioId}/transactions/00000000-0000-0000-0000-000000000000`,
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Transaction not found' });
  });
});

describe('PATCH /portfolios/:portfolio_id/transactions/:id', () => {
  let portfolioId: string;
  let transactionId: string;

  beforeAll(async () => {
    portfolioId = (await createPortfolio()).id;
    const { body } = await createTransaction(portfolioId);
    transactionId = body.id;
  });

  it('returns 200 with updated fields', async () => {
    const response = await fetch(
      `${BASE_URL}/portfolios/${portfolioId}/transactions/${transactionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unique_symbol: 'ASX:ANZ', amount: 20 }),
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ id: transactionId, unique_symbol: 'ASX:ANZ', amount: 20 });
    expect(body.updated_at).toBeDefined();
  });

  it('preserves unchanged fields', async () => {
    const response = await fetch(
      `${BASE_URL}/portfolios/${portfolioId}/transactions/${transactionId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: 'USD' }),
      },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.unique_symbol).toBe('ASX:ANZ');
    expect(body.currency).toBe('USD');
  });

  it('returns 404 for a non-existent transaction', async () => {
    const response = await fetch(
      `${BASE_URL}/portfolios/${portfolioId}/transactions/00000000-0000-0000-0000-000000000000`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unique_symbol: 'ASX:NAB' }),
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Transaction not found' });
  });
});

describe('GET /portfolios/:portfolio_id/transactions', () => {
  let portfolioId: string;
  let otherPortfolioId: string;

  beforeAll(async () => {
    [portfolioId, otherPortfolioId] = await Promise.all([
      createPortfolio().then((p) => p.id),
      createPortfolio().then((p) => p.id),
    ]);

    await Promise.all([
      createTransaction(portfolioId, { unique_symbol: 'ASX:CBA', date: '2024-03-01T00:00:00.000Z' }),
      createTransaction(portfolioId, { unique_symbol: 'ASX:ANZ', date: '2024-06-01T00:00:00.000Z' }),
      createTransaction(portfolioId, { unique_symbol: 'ASX:NAB', date: '2024-09-01T00:00:00.000Z' }),
      createTransaction(otherPortfolioId, { unique_symbol: 'ASX:WBC' }),
    ]);
  });

  it('returns only transactions for the portfolio', async () => {
    const response = await fetch(`${BASE_URL}/portfolios/${portfolioId}/transactions`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(3);
    expect(body.data.every((t: { portfolio_id: string }) => t.portfolio_id === portfolioId)).toBe(true);
  });

  it('returns pagination metadata', async () => {
    const response = await fetch(`${BASE_URL}/portfolios/${portfolioId}/transactions`);

    const body = await response.json();
    expect(body).toMatchObject({ total: 3, page: 1, page_size: 20 });
  });

  it('supports pagination', async () => {
    const page1 = await fetch(
      `${BASE_URL}/portfolios/${portfolioId}/transactions?page=1&page_size=2`,
    ).then((r) => r.json());
    const page2 = await fetch(
      `${BASE_URL}/portfolios/${portfolioId}/transactions?page=2&page_size=2`,
    ).then((r) => r.json());

    expect(page1.data).toHaveLength(2);
    expect(page2.data).toHaveLength(1);
    const page1Ids = page1.data.map((t: { id: string }) => t.id);
    const page2Ids = page2.data.map((t: { id: string }) => t.id);
    expect(page1Ids.filter((id: string) => page2Ids.includes(id))).toHaveLength(0);
  });

  it('filters by date_from', async () => {
    const response = await fetch(
      `${BASE_URL}/portfolios/${portfolioId}/transactions?date_from=2024-05-01T00:00:00.000Z`,
    );

    const body = await response.json();
    expect(body.total).toBe(2);
    expect(body.data.map((t: { unique_symbol: string }) => t.unique_symbol).sort()).toEqual(['ASX:ANZ', 'ASX:NAB']);
  });

  it('filters by date_to', async () => {
    const response = await fetch(
      `${BASE_URL}/portfolios/${portfolioId}/transactions?date_to=2024-05-01T00:00:00.000Z`,
    );

    const body = await response.json();
    expect(body.total).toBe(1);
    expect(body.data[0].unique_symbol).toBe('ASX:CBA');
  });

  it('filters by date range', async () => {
    const response = await fetch(
      `${BASE_URL}/portfolios/${portfolioId}/transactions?date_from=2024-04-01T00:00:00.000Z&date_to=2024-08-01T00:00:00.000Z`,
    );

    const body = await response.json();
    expect(body.total).toBe(1);
    expect(body.data[0].unique_symbol).toBe('ASX:ANZ');
  });

  it('returns an empty list for a portfolio with no transactions', async () => {
    const emptyPortfolioId = (await createPortfolio()).id;
    const response = await fetch(
      `${BASE_URL}/portfolios/${emptyPortfolioId}/transactions`,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: [], total: 0 });
  });
});
