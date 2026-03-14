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
