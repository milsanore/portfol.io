import { accumulatePositions, calculateReturn, TickerAgg } from '../return-calculator';

const buy = (symbol: string, size: string, price: string, currency = 'USD') => ({
  unique_symbol: symbol,
  side: 'buy',
  size,
  price,
  currency,
});

const sell = (symbol: string, size: string, price: string, currency = 'USD') => ({
  unique_symbol: symbol,
  side: 'sell',
  size,
  price,
  currency,
});

describe('accumulatePositions', () => {
  it('accumulates a single buy', () => {
    const positions = accumulatePositions([buy('CBA', '10', '100')]);
    expect(positions.get('CBA')).toEqual({
      buyShares: 10,
      sellShares: 0,
      buyCostUsd: 1000,
      sellProceedsUsd: 0,
    });
  });

  it('accumulates a sell', () => {
    const positions = accumulatePositions([sell('CBA', '5', '120')]);
    expect(positions.get('CBA')).toEqual({
      buyShares: 0,
      sellShares: 5,
      buyCostUsd: 0,
      sellProceedsUsd: 600,
    });
  });

  it('sums multiple rows for the same symbol', () => {
    const positions = accumulatePositions([buy('CBA', '10', '100'), buy('CBA', '5', '200')]);
    const agg = positions.get('CBA')!;
    expect(agg.buyShares).toBeCloseTo(15);
    expect(agg.buyCostUsd).toBeCloseTo(2000);
  });

  it('tracks multiple symbols independently', () => {
    const positions = accumulatePositions([buy('CBA', '10', '100'), buy('ANZ', '20', '25')]);
    expect(positions.get('CBA')!.buyCostUsd).toBeCloseTo(1000);
    expect(positions.get('ANZ')!.buyCostUsd).toBeCloseTo(500);
  });

  it('converts non-USD currency to USD', () => {
    // AUD rate = 0.63
    const positions = accumulatePositions([buy('CBA', '10', '100', 'AUD')]);
    expect(positions.get('CBA')!.buyCostUsd).toBeCloseTo(630);
  });

  it('accumulates into an existing positions map', () => {
    const positions = accumulatePositions([buy('CBA', '10', '100')]);
    accumulatePositions([buy('CBA', '5', '100')], positions);
    expect(positions.get('CBA')!.buyShares).toBeCloseTo(15);
  });

  it('throws on unsupported currency', () => {
    expect(() => accumulatePositions([buy('CBA', '10', '100', 'XYZ')])).toThrow(
      'Unsupported currency: XYZ',
    );
  });
});

describe('calculateReturn', () => {
  const pos = (
    buyShares: number,
    buyCostUsd: number,
    sellShares = 0,
    sellProceedsUsd = 0,
  ): TickerAgg => ({
    buyShares,
    buyCostUsd,
    sellShares,
    sellProceedsUsd,
  });

  it('returns zeros for empty positions', () => {
    expect(calculateReturn(new Map(), new Map())).toEqual({
      startValue: 0,
      endValue: 0,
      returnPct: 0,
    });
  });

  it('computes return using tick price', () => {
    const positions = new Map([['CBA', pos(10, 1000)]]);
    const prices = new Map([['CBA', 120]]);
    const result = calculateReturn(positions, prices);
    expect(result.startValue).toBeCloseTo(1000);
    expect(result.endValue).toBeCloseTo(1200);
    expect(result.returnPct).toBeCloseTo(20);
  });

  it('falls back to avg buy price when tick data is missing', () => {
    const positions = new Map([['CBA', pos(10, 1000)]]);
    const result = calculateReturn(positions, new Map());
    expect(result.startValue).toBeCloseTo(1000);
    expect(result.endValue).toBeCloseTo(1000);
    expect(result.returnPct).toBeCloseTo(0);
  });

  it('accounts for sell proceeds', () => {
    // buy 100 @ 10 (cost=1000), sell 50 @ 15 (proceeds=750), remaining 50 @ 20 (=1000)
    const positions = new Map([['CBA', pos(100, 1000, 50, 750)]]);
    const prices = new Map([['CBA', 20]]);
    const result = calculateReturn(positions, prices);
    expect(result.startValue).toBeCloseTo(1000);
    expect(result.endValue).toBeCloseTo(1750);
    expect(result.returnPct).toBeCloseTo(75);
  });

  it('returns 0% return when startValue is zero', () => {
    const positions = new Map([['CBA', pos(0, 0, 0, 0)]]);
    const result = calculateReturn(positions, new Map());
    expect(result.returnPct).toBe(0);
  });

  it('sums across multiple symbols', () => {
    const positions = new Map([
      ['CBA', pos(10, 1000)],
      ['ANZ', pos(20, 500)],
    ]);
    const prices = new Map([
      ['CBA', 120],
      ['ANZ', 30],
    ]);
    const result = calculateReturn(positions, prices);
    expect(result.startValue).toBeCloseTo(1500);
    expect(result.endValue).toBeCloseTo(1200 + 600);
    expect(result.returnPct).toBeCloseTo(20);
  });
});
