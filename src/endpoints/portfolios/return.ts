import { FastifyPluginCallback } from 'fastify';
import { pool } from '../../db';
import { TxRow, TickerAgg, accumulatePositions, calculateReturn } from './return-calculator';

const PAGE_SIZE = 500;

interface ClosePriceRow {
  unique_symbol: string;
  close_price: string;
}

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
          400: { $ref: 'ErrorResponse' },
          404: { $ref: 'ErrorResponse' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const {
        start_date = null,
        end_date = new Date().toISOString(),
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
        const transactions = await pool.query<TxRow>({
          text: `SELECT
                   data->>'unique_symbol'     AS unique_symbol,
                   data->>'side'              AS side,
                   (data->>'size')::numeric AS size,
                   (data->>'price')::numeric  AS price,
                   data->>'currency'          AS currency
                 FROM transactions
                 WHERE portfolio_id = $1
                   AND ($2::text IS NULL
                        OR COALESCE(data->>'date', data->>'created_at') >= $2)
                   AND COALESCE(data->>'date', data->>'created_at') <= $3
                 ORDER BY COALESCE(data->>'date', data->>'created_at')
                 LIMIT $4 OFFSET $5`,
          values: [id, start_date, end_date, PAGE_SIZE, offset],
        });

        try {
          accumulatePositions(transactions.rows, positions);
        } catch (e) {
          reply.code(400);
          return { error: (e as Error).message };
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
                   AND data->>'pricing_date' <= LEFT($2, 10)
                 GROUP BY data->>'unique_symbol'
               )
               SELECT t.data->>'unique_symbol' AS unique_symbol,
                      AVG((t.data->>'price_close_usd')::numeric) AS close_price
               FROM tick_data t
               JOIN latest_dates l
                 ON t.data->>'unique_symbol' = l.unique_symbol
                AND t.data->>'pricing_date' = l.pricing_date
               GROUP BY t.data->>'unique_symbol'`,
        values: [symbols, end_date],
      });

      const latestPrices = new Map<string, number>();
      for (const pxRow of pxRows.rows) {
        latestPrices.set(pxRow.unique_symbol, parseFloat(pxRow.close_price));
      }

      const { startValue, endValue, returnPct } = calculateReturn(positions, latestPrices);

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
