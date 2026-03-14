import { buildApp } from '../../../app';
import { pool } from '../../../db';

jest.mock('../../../db', () => ({
  pool: { query: jest.fn() },
}));

const mockQuery = pool.query as jest.Mock;

const portfolioId = '123e4567-e89b-12d3-a456-426614174001';
const customerId = '123e4567-e89b-12d3-a456-426614174000';

const portfolioData = {
  customer_id: customerId,
  name: 'My Portfolio',
  currency: 'AUD',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const portfolioRow = { id: portfolioId, data: portfolioData };

const portfolioResponse = {
  id: portfolioId,
  customer_id: customerId,
  name: 'My Portfolio',
  currency: 'AUD',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

describe('GET /portfolios', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns 200 with empty list', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const response = await app.inject({ method: 'GET', url: '/portfolios' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: [], total: 0, page: 1, page_size: 20 });
  });

  it('returns 200 with portfolio list', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [portfolioRow] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] });

    const response = await app.inject({ method: 'GET', url: '/portfolios' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [portfolioResponse],
      total: 1,
      page: 1,
      page_size: 20,
    });
  });

  it('filters by customer_id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios?customer_id=${customerId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ values: [customerId, 20, 0] }),
    );
  });

  it('supports pagination', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const response = await app.inject({
      method: 'GET',
      url: '/portfolios?page=2&page_size=5',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ page: 2, page_size: 5 });
    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ values: [null, 5, 5] }));
  });
});

describe('POST /portfolios', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns 201 with created portfolio', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [portfolioRow] });

    const response = await app.inject({
      method: 'POST',
      url: '/portfolios',
      payload: { customer_id: customerId, name: 'My Portfolio', currency: 'AUD' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual(portfolioResponse);
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/portfolios',
      payload: { name: 'My Portfolio' },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /portfolios/:id', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns 200 with portfolio', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [portfolioRow] });

    const response = await app.inject({ method: 'GET', url: `/portfolios/${portfolioId}` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(portfolioResponse);
  });

  it('returns 404 when portfolio not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await app.inject({ method: 'GET', url: `/portfolios/${portfolioId}` });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'Portfolio not found' });
  });
});

describe('GET /portfolios/:id/return', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  const portfolioExistsRow = { rows: [{ id: portfolioId }] };
  const noTransactions = { rows: [] };
  const noClosePrices = { rows: [] };

  it('returns 404 when portfolio not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/return?start_date=2024-01-01`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'Portfolio not found' });
  });

  it('returns 200 with zero return when no transactions exist', async () => {
    mockQuery.mockResolvedValueOnce(portfolioExistsRow).mockResolvedValueOnce(noTransactions);

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/return?start_date=2024-01-01&end_date=2024-12-31`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      portfolio_id: portfolioId,
      algorithm: 'SVE',
      start_value: 0,
      end_value: 0,
      return_pct: 0,
    });
  });

  it('returns 0% when no tick data exists (falls back to purchase price)', async () => {
    // 10 shares of ASX:CBA @ 100 each
    const txRow = {
      unique_symbol: 'ASX:CBA',
      side: 'buy',
      amount: '10',
      price: '100',
      currency: 'USD',
    };
    mockQuery
      .mockResolvedValueOnce(portfolioExistsRow)
      .mockResolvedValueOnce({ rows: [txRow] }) // first page (< PAGE_SIZE → done)
      .mockResolvedValueOnce(noClosePrices); // no tick data → fallback

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/return?start_date=2024-01-01&end_date=2024-12-31`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.start_value).toBeCloseTo(1000);
    expect(body.end_value).toBeCloseTo(1000); // fallback: net_shares × avg_buy_price
    expect(body.return_pct).toBeCloseTo(0);
  });

  it('computes correct return for buy-only position with tick data', async () => {
    // Buy 10 @ 100, current price 120 → return = 20%
    const txRow = {
      unique_symbol: 'ASX:CBA',
      side: 'buy',
      amount: '10',
      price: '100',
      currency: 'USD',
    };
    const priceRow = { unique_symbol: 'ASX:CBA', close_price: '120' };
    mockQuery
      .mockResolvedValueOnce(portfolioExistsRow)
      .mockResolvedValueOnce({ rows: [txRow] })
      .mockResolvedValueOnce({ rows: [priceRow] });

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/return?start_date=2024-01-01&end_date=2024-12-31`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.start_value).toBeCloseTo(1000);
    expect(body.end_value).toBeCloseTo(1200);
    expect(body.return_pct).toBeCloseTo(20);
  });

  it('accounts for realized PnL from sells', async () => {
    // Buy 100 @ 10 (cost = 1000), sell 50 @ 15 (proceeds = 750), remaining 50 @ 20 (= 1000)
    // end_value = 750 + 1000 = 1750, return = 75%
    const buyRow = {
      unique_symbol: 'ASX:CBA',
      side: 'buy',
      amount: '100',
      price: '10',
      currency: 'USD',
    };
    const sellRow = {
      unique_symbol: 'ASX:CBA',
      side: 'sell',
      amount: '50',
      price: '15',
      currency: 'USD',
    };
    const priceRow = { unique_symbol: 'ASX:CBA', close_price: '20' };
    mockQuery
      .mockResolvedValueOnce(portfolioExistsRow)
      .mockResolvedValueOnce({ rows: [buyRow, sellRow] })
      .mockResolvedValueOnce({ rows: [priceRow] });

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/return?start_date=2024-01-01&end_date=2024-12-31`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.start_value).toBeCloseTo(1000);
    expect(body.end_value).toBeCloseTo(1750);
    expect(body.return_pct).toBeCloseTo(75);
  });

  it('defaults algorithm to SVE', async () => {
    mockQuery.mockResolvedValueOnce(portfolioExistsRow).mockResolvedValueOnce(noTransactions);

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/return`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ algorithm: 'SVE' });
  });
});

describe('PATCH /portfolios/:id', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns 200 with updated portfolio', async () => {
    const updatedRow = {
      id: portfolioId,
      data: { ...portfolioData, name: 'Renamed', updated_at: '2024-02-01T00:00:00.000Z' },
    };
    mockQuery.mockResolvedValueOnce({ rows: [updatedRow] });

    const response = await app.inject({
      method: 'PATCH',
      url: `/portfolios/${portfolioId}`,
      payload: { name: 'Renamed' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ name: 'Renamed' });
  });

  it('returns 404 when portfolio not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await app.inject({
      method: 'PATCH',
      url: `/portfolios/${portfolioId}`,
      payload: { name: 'Renamed' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'Portfolio not found' });
  });
});
