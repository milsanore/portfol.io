import { randomUUID } from 'crypto';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

async function createPortfolio() {
  const response = await fetch(`${BASE_URL}/portfolios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: randomUUID(), name: 'Return Test Portfolio', currency: 'AUD' }),
  });
  return (await response.json()) as { id: string };
}

async function createTransaction(portfolioId: string, payload: Record<string, unknown> = {}) {
  await fetch(`${BASE_URL}/portfolios/${portfolioId}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      unique_symbol: 'ASX:CBA',
      side: 'buy',
      size: 10,
      price: 100,
      currency: 'AUD',
      ...payload,
    }),
  });
}

async function getReturn(portfolioId: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const response = await fetch(`${BASE_URL}/portfolios/${portfolioId}/return${qs ? `?${qs}` : ''}`);
  return { status: response.status, body: await response.json() };
}

// Rates from src/forex.ts — kept in sync manually; if forex.ts changes, update here too
const AUD_RATE = 0.63;

// Pinned test date: tick data for this date was verified in the DB on 2026-03-14.
// end_date resolves to the latest available pricing_date for both symbols.
// AVG(price_close_usd) across duplicate rows per symbol+date:
//   ASX:CBA → 99.2766328761455
//   ASX:ANZ → 22.390271988684835
const PINNED_END_DATE = '2025-12-01T00:00:00.000Z';
const PINNED_TX_DATE = '2025-11-01T00:00:00.000Z';
const CBA_CLOSE_USD = 99.2766328761455;
const ANZ_CLOSE_USD = 22.390271988684835;

describe('GET /portfolios/:id/return', () => {
  it('returns 404 for a non-existent portfolio', async () => {
    const { status, body } = await getReturn('00000000-0000-0000-0000-000000000000');
    expect(status).toBe(404);
    expect(body).toEqual({ error: 'Portfolio not found' });
  });

  it('returns 200 with zero values for an empty portfolio', async () => {
    const { id } = await createPortfolio();
    const { status, body } = await getReturn(id);

    expect(status).toBe(200);
    expect(body).toMatchObject({
      portfolio_id: id,
      algorithm: 'SVE',
      start_value: 0,
      end_value: 0,
      return_pct: 0,
    });
    expect(body.start_date).toBeNull();
    expect(body.end_date).toBeDefined();
  });

  it('computes return against real tick data (pinned end_date)', async () => {
    // Buy 10 ASX:CBA @ AUD 100 on 2025-11-01
    // start_value = 10 * 100 * 0.63 = 630 USD
    // end_value   = 10 * CBA_CLOSE_USD (avg of 6 duplicate rows for 2025-11-28)
    // return_pct  = (end - start) / start * 100
    const { id } = await createPortfolio();
    await createTransaction(id, {
      unique_symbol: 'ASX:CBA',
      size: 10,
      price: 100,
      currency: 'AUD',
      date: PINNED_TX_DATE,
    });

    const { status, body } = await getReturn(id, { end_date: PINNED_END_DATE });
    const expectedStart = 10 * 100 * AUD_RATE;
    const expectedEnd = 10 * CBA_CLOSE_USD;

    expect(status).toBe(200);
    expect(body.start_value).toBeCloseTo(expectedStart, 4);
    expect(body.end_value).toBeCloseTo(expectedEnd, 4);
    expect(body.return_pct).toBeCloseTo((expectedEnd - expectedStart) / expectedStart * 100, 4);
  });

  it('sums positions across multiple symbols against real tick data', async () => {
    // CBA: 10 @ AUD 100, ANZ: 20 @ AUD 25
    // start_value = 10*100*0.63 + 20*25*0.63 = 630 + 315 = 945
    // end_value   = 10*CBA_CLOSE_USD + 20*ANZ_CLOSE_USD
    const { id } = await createPortfolio();
    await createTransaction(id, { unique_symbol: 'ASX:CBA', size: 10, price: 100, currency: 'AUD', date: PINNED_TX_DATE });
    await createTransaction(id, { unique_symbol: 'ASX:ANZ', size: 20, price: 25, currency: 'AUD', date: PINNED_TX_DATE });

    const { status, body } = await getReturn(id, { end_date: PINNED_END_DATE });
    const expectedStart = 10 * 100 * AUD_RATE + 20 * 25 * AUD_RATE;
    const expectedEnd = 10 * CBA_CLOSE_USD + 20 * ANZ_CLOSE_USD;

    expect(status).toBe(200);
    expect(body.start_value).toBeCloseTo(expectedStart, 4);
    expect(body.end_value).toBeCloseTo(expectedEnd, 4);
    expect(body.return_pct).toBeCloseTo((expectedEnd - expectedStart) / expectedStart * 100, 4);
  });

  it('accounts for realized PnL from sells', async () => {
    // Buy 100 ASX:CBA @ AUD 10, sell 50 @ AUD 12 — no tick data needed for sell proceeds
    // buyCostUsd      = 100 * 10 * 0.63 = 630
    // sellProceedsUsd = 50  * 12 * 0.63 = 378
    // netShares = 50 → end_value = 378 + 50 * CBA_CLOSE_USD
    const { id } = await createPortfolio();
    await createTransaction(id, { unique_symbol: 'ASX:CBA', side: 'buy',  size: 100, price: 10, currency: 'AUD', date: PINNED_TX_DATE });
    await createTransaction(id, { unique_symbol: 'ASX:CBA', side: 'sell', size: 50,  price: 12, currency: 'AUD', date: PINNED_TX_DATE });

    const { status, body } = await getReturn(id, { end_date: PINNED_END_DATE });
    const expectedStart = 100 * 10 * AUD_RATE;
    const expectedEnd   = 50 * 12 * AUD_RATE + 50 * CBA_CLOSE_USD;

    expect(status).toBe(200);
    expect(body.start_value).toBeCloseTo(expectedStart, 4);
    expect(body.end_value).toBeCloseTo(expectedEnd, 4);
    expect(body.return_pct).toBeCloseTo((expectedEnd - expectedStart) / expectedStart * 100, 4);
  });

  it('filters transactions by start_date', async () => {
    // Two buys: Oct and Nov. Filter from 2025-11-01 → only the Nov buy counts.
    const { id } = await createPortfolio();
    await createTransaction(id, { unique_symbol: 'ASX:CBA', size: 10, price: 100, currency: 'AUD', date: '2025-10-30T00:00:00.000Z' });
    await createTransaction(id, { unique_symbol: 'ASX:CBA', size: 10, price: 200, currency: 'AUD', date: PINNED_TX_DATE });

    const { status, body } = await getReturn(id, { start_date: '2025-11-01T00:00:00.000Z', end_date: PINNED_END_DATE });
    const expectedStart = 10 * 200 * AUD_RATE;
    const expectedEnd   = 10 * CBA_CLOSE_USD;

    expect(status).toBe(200);
    expect(body.start_value).toBeCloseTo(expectedStart, 4);
    expect(body.end_value).toBeCloseTo(expectedEnd, 4);
  });

  it('filters transactions by end_date (excludes tick data beyond cutoff)', async () => {
    // Buy with no tick data before cutoff date → falls back to avg buy price → 0% return
    const { id } = await createPortfolio();
    await createTransaction(id, { unique_symbol: 'ASX:CBA', size: 10, price: 100, currency: 'AUD', date: PINNED_TX_DATE });

    const { status, body } = await getReturn(id, { end_date: '2025-10-28T00:00:00.000Z' });

    expect(status).toBe(200);
    // Tick data starts 2025-10-29, so nothing available → fallback to avg buy price → 0%
    expect(body.return_pct).toBeCloseTo(0);
  });

  it('defaults algorithm to SVE and accepts explicit algorithm param', async () => {
    const { id } = await createPortfolio();

    const [defaultRes, explicitRes] = await Promise.all([
      getReturn(id),
      getReturn(id, { algorithm: 'SVE' }),
    ]);

    expect(defaultRes.body.algorithm).toBe('SVE');
    expect(explicitRes.body.algorithm).toBe('SVE');
  });
});
