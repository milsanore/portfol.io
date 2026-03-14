import { FastifyPluginCallback } from 'fastify';
import { pool } from '../../db';
import { toUsd } from '../../forex';

interface TransactionAggRow {
  unique_symbol: string;
  side: string;
  amount: string;
  price: string;
  currency: string;
}

interface TickerAgg {
  buyShares: number;
  sellShares: number;
  buyCostUsd: number;
  sellProceedsUsd: number;
}

interface ClosePriceRow {
  unique_symbol: string;
  close_price: string;
}

const PAGE_SIZE = 500;

export const getPortfolioReturn: FastifyPluginCallback = (fastify) => {
  fastify.get<{
    Params: { id: string };
    Querystring: { start_date?: string; end_date?: string; algorithm?: string };
  }>(
    '/portfolios/:id/return',
    {
      schema: {
        params: { $ref: 'PortfolioParams' },
        querystring: { $ref: 'PortfolioReturnQuerystring' },
        response: {
          200: { $ref: 'PortfolioReturn' },
          404: { $ref: 'ErrorResponse' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const {
        start_date = null,
        end_date = new Date().toISOString().slice(0, 10),
        algorithm = 'SVE',
      } = request.query;

      const portfolioCheck = await pool.query({
        name: 'check-portfolio-exists-for-return',
        text: 'SELECT id FROM portfolios WHERE id = $1',
        values: [id],
      });

      if (portfolioCheck.rows.length === 0) {
        reply.code(404);
        return { error: 'Portfolio not found' };
      }

      // Accumulate per-symbol aggregates by iterating transactions in pages
      const positions = new Map<string, TickerAgg>();
      let offset = 0;
      while (true) {
        const transactions = await pool.query<TransactionAggRow>({
          text: `SELECT
                   data->>'unique_symbol'     AS unique_symbol,
                   data->>'side'              AS side,
                   (data->>'amount')::numeric AS amount,
                   (data->>'price')::numeric  AS price,
                   data->>'currency'          AS currency
                 FROM transactions
                 WHERE portfolio_id = $1
                   AND ($2::text IS NULL
                        OR LEFT(COALESCE(data->>'date', data->>'created_at'), 10) >= $2)
                   AND LEFT(COALESCE(data->>'date', data->>'created_at'), 10) <= $3
                 ORDER BY COALESCE(data->>'date', data->>'created_at')
                 LIMIT $4 OFFSET $5`,
          values: [id, start_date, end_date, PAGE_SIZE, offset],
        });

        for (const tx of transactions.rows) {
          if (!positions.has(tx.unique_symbol)) {
            positions.set(tx.unique_symbol, {
              buyCostUsd: 0,
              sellProceedsUsd: 0,
              buyShares: 0,
              sellShares: 0,
            });
          }

          const agg = positions.get(tx.unique_symbol)!;
          const amount = parseFloat(tx.amount);
          const usdPrice = toUsd(parseFloat(tx.price), tx.currency);
          if (tx.side === 'buy') {
            agg.buyShares += amount;
            agg.buyCostUsd += amount * usdPrice;
          } else {
            agg.sellShares += amount;
            agg.sellProceedsUsd += amount * usdPrice;
          }
        }

        if (transactions.rows.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }

      if (positions.size === 0) {
        return {
          portfolio_id: id,
          algorithm,
          start_date,
          end_date,
          start_value: 0,
          end_value: 0,
          return_pct: 0,
        };
      }

      // Fetch the latest close price per symbol up to end_date.
      // Multiple rows can exist for the same symbol+date (duplicate source data),
      // so we find the latest pricing_date per symbol then AVG across duplicates
      // for a deterministic, representative price.
      const symbols = Array.from(positions.keys());
      const pxRows = await pool.query<ClosePriceRow>({
        text: `WITH latest_dates AS (
                 SELECT data->>'unique_symbol' AS unique_symbol,
                        MAX(data->>'pricing_date') AS pricing_date
                 FROM tick_data
                 WHERE data->>'unique_symbol' = ANY($1::text[])
                   AND data->>'pricing_date' <= $2
                 GROUP BY data->>'unique_symbol'
               )
               SELECT t.data->>'unique_symbol' AS unique_symbol,
                      AVG((t.data->>'price_close_usd')::numeric) AS close_price
               FROM tick_data t
               JOIN latest_dates l
                 ON t.data->>'unique_symbol' = l.unique_symbol
                AND t.data->>'pricing_date'  = l.pricing_date
               GROUP BY t.data->>'unique_symbol'`,
        values: [symbols, end_date],
      });

      const latestPrices = new Map<string, number>();
      for (const pxRow of pxRows.rows) {
        latestPrices.set(pxRow.unique_symbol, parseFloat(pxRow.close_price));
      }

      let startValue = 0;
      let endValue = 0;

      // now that we have our positions and prices, we can calculate portfolio return
      for (const [symbol, agg] of positions) {
        const netShares = agg.buyShares - agg.sellShares;
        const avgBuyPrice = agg.buyShares > 0 ? agg.buyCostUsd / agg.buyShares : 0;

        startValue += agg.buyCostUsd;
        endValue += agg.sellProceedsUsd;

        if (netShares > 0) {
          // if missing spot price, default to zero-profit
          const closePrice = latestPrices.get(symbol) ?? avgBuyPrice;
          endValue += netShares * closePrice;
        }
      }

      const returnPct = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;

      return {
        portfolio_id: id,
        algorithm,
        start_date,
        end_date,
        start_value: startValue,
        end_value: endValue,
        return_pct: returnPct,
      };
    },
  );
};
