import { toUsd } from '../../forex';

export interface TxRow {
  unique_symbol: string;
  side: string;
  size: string;
  price: string;
  currency: string;
}

export interface TickerAgg {
  buyShares: number;
  sellShares: number;
  buyCostUsd: number;
  sellProceedsUsd: number;
}

export function accumulatePositions(
  rows: TxRow[],
  positions: Map<string, TickerAgg> = new Map(),
): Map<string, TickerAgg> {
  for (const tx of rows) {
    if (!positions.has(tx.unique_symbol)) {
      positions.set(tx.unique_symbol, {
        buyCostUsd: 0,
        sellProceedsUsd: 0,
        buyShares: 0,
        sellShares: 0,
      });
    }

    const agg = positions.get(tx.unique_symbol)!;
    const size = parseFloat(tx.size);
    const usdPrice = toUsd(parseFloat(tx.price), tx.currency);

    if (tx.side === 'buy') {
      agg.buyShares += size;
      agg.buyCostUsd += size * usdPrice;
    } else {
      agg.sellShares += size;
      agg.sellProceedsUsd += size * usdPrice;
    }
  }
  return positions;
}

export function calculateReturn(
  positions: Map<string, TickerAgg>,
  latestPrices: Map<string, number>,
): { startValue: number; endValue: number; returnPct: number } {
  let startValue = 0;
  let endValue = 0;

  for (const [symbol, agg] of positions) {
    const netShares = agg.buyShares - agg.sellShares;
    const avgBuyPrice = agg.buyShares > 0 ? agg.buyCostUsd / agg.buyShares : 0;

    startValue += agg.buyCostUsd;
    endValue += agg.sellProceedsUsd;

    if (netShares > 0) {
      const closePrice = latestPrices.get(symbol) ?? avgBuyPrice;
      endValue += netShares * closePrice;
    }
  }

  const returnPct = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
  return { startValue, endValue, returnPct };
}
