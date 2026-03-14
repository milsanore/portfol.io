import { FastifyPluginCallback } from 'fastify';
import { pool } from '../../db';
import { TransactionRow, rowToResponse } from '../../types/transaction';

export const listTransactions: FastifyPluginCallback = (fastify) => {
  fastify.get<{
    Params: { portfolio_id: string };
    Querystring: {
      date_from?: string;
      date_to?: string;
      page?: number;
      page_size?: number;
    };
  }>(
    '/portfolios/:portfolio_id/transactions',
    {
      schema: {
        params: {
          type: 'object',
          properties: { portfolio_id: { type: 'string', format: 'uuid' } },
          required: ['portfolio_id'],
        },
        querystring: { $ref: 'ListTransactionsQuerystring' },
        response: { 200: { $ref: 'ListTransactionsResponse' } },
      },
    },
    async (request) => {
      const { portfolio_id } = request.params;
      const { date_from, date_to, page = 1, page_size = 20 } = request.query;
      const offset = (page - 1) * page_size;

      const [dataResult, countResult] = await Promise.all([
        pool.query<TransactionRow>({
          name: 'list-transactions',
          text: `SELECT id, data FROM transactions
                 WHERE data->>'portfolio_id' = $1
                   AND ($2::text IS NULL OR COALESCE(data->>'date', data->>'created_at') >= $2)
                   AND ($3::text IS NULL OR COALESCE(data->>'date', data->>'created_at') <= $3)
                 ORDER BY COALESCE(data->>'date', data->>'created_at') DESC
                 LIMIT $4 OFFSET $5`,
          values: [portfolio_id, date_from ?? null, date_to ?? null, page_size, offset],
        }),
        pool.query<{ total: string }>({
          name: 'count-transactions',
          text: `SELECT COUNT(*)::text AS total FROM transactions
                 WHERE data->>'portfolio_id' = $1
                   AND ($2::text IS NULL OR COALESCE(data->>'date', data->>'created_at') >= $2)
                   AND ($3::text IS NULL OR COALESCE(data->>'date', data->>'created_at') <= $3)`,
          values: [portfolio_id, date_from ?? null, date_to ?? null],
        }),
      ]);

      return {
        data: dataResult.rows.map(rowToResponse),
        total: parseInt(countResult.rows[0].total, 10),
        page,
        page_size,
      };
    },
  );
};
