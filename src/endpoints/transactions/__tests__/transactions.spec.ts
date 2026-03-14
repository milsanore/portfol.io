import { buildApp } from '../../../app';
import { pool } from '../../../db';

jest.mock('../../../db', () => ({
  pool: { query: jest.fn() },
}));

const mockQuery = pool.query as jest.Mock;

const portfolioId = '123e4567-e89b-12d3-a456-426614174001';
const transactionId = '223e4567-e89b-12d3-a456-426614174002';

const transactionData = {
  portfolio_id: portfolioId,
  unique_symbol: 'ASX:CBA',
  side: 'buy',
  amount: 10,
  price: 100.5,
  currency: 'AUD',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const transactionRow = { id: transactionId, data: transactionData };

const transactionResponse = { id: transactionId, ...transactionData };

describe('GET /portfolios/:portfolio_id/transactions', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns 200 with empty list', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/transactions`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: [], total: 0, page: 1, page_size: 20 });
  });

  it('returns 200 with transaction list', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [transactionRow] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] });

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/transactions`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [transactionResponse],
      total: 1,
      page: 1,
      page_size: 20,
    });
  });

  it('filters by date range', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/transactions?date_from=2024-01-01T00:00:00.000Z&date_to=2024-12-31T23:59:59.000Z`,
    });

    expect(response.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        values: [portfolioId, '2024-01-01T00:00:00.000Z', '2024-12-31T23:59:59.000Z', 20, 0],
      }),
    );
  });

  it('supports pagination', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/transactions?page=2&page_size=5`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ page: 2, page_size: 5 });
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({ values: [portfolioId, null, null, 5, 5] }),
    );
  });
});

describe('POST /portfolios/:portfolio_id/transactions', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns 201 with created transaction', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [transactionRow] });

    const response = await app.inject({
      method: 'POST',
      url: `/portfolios/${portfolioId}/transactions`,
      payload: {
        unique_symbol: 'ASX:CBA',
        side: 'buy',
        amount: 10,
        price: 100.5,
        currency: 'AUD',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual(transactionResponse);
  });

  it('returns 400 when required fields are missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/portfolios/${portfolioId}/transactions`,
      payload: { unique_symbol: 'ASX:CBA' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 400 for invalid side value', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/portfolios/${portfolioId}/transactions`,
      payload: {
        unique_symbol: 'ASX:CBA',
        side: 'hold',
        amount: 10,
        price: 100.5,
        currency: 'AUD',
      },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('GET /portfolios/:portfolio_id/transactions/:id', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns 200 with transaction', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [transactionRow] });

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/transactions/${transactionId}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(transactionResponse);
  });

  it('returns 404 when transaction not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await app.inject({
      method: 'GET',
      url: `/portfolios/${portfolioId}/transactions/${transactionId}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'Transaction not found' });
  });
});

describe('PATCH /portfolios/:portfolio_id/transactions/:id', () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('returns 200 with updated transaction', async () => {
    const updatedRow = {
      id: transactionId,
      data: {
        ...transactionData,
        unique_symbol: 'ASX:ANZ',
        updated_at: '2024-02-01T00:00:00.000Z',
      },
    };
    mockQuery.mockResolvedValueOnce({ rows: [updatedRow] });

    const response = await app.inject({
      method: 'PATCH',
      url: `/portfolios/${portfolioId}/transactions/${transactionId}`,
      payload: { unique_symbol: 'ASX:ANZ' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ unique_symbol: 'ASX:ANZ' });
  });

  it('returns 404 when transaction not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await app.inject({
      method: 'PATCH',
      url: `/portfolios/${portfolioId}/transactions/${transactionId}`,
      payload: { unique_symbol: 'ASX:ANZ' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'Transaction not found' });
  });
});
