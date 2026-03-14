import { FastifyPluginCallback } from 'fastify';
import { pool } from '../../db';
import { PortfolioRow, rowToResponse } from '../../types/portfolio';

export const listPortfolios: FastifyPluginCallback = (fastify) => {
  fastify.get<{
    Querystring: {
      customer_id?: string;
      page?: number;
      page_size?: number;
    };
  }>(
    '/portfolios',
    {
      schema: {
        querystring: { $ref: 'ListPortfoliosQuerystring' },
        response: { 200: { $ref: 'ListPortfoliosResponse' } },
      },
    },
    async (request) => {
      const { customer_id, page = 1, page_size = 20 } = request.query;
      const offset = (page - 1) * page_size;

      const [dataResult, countResult] = await Promise.all([
        pool.query<PortfolioRow>({
          name: 'list-portfolios',
          text: `SELECT id, data FROM portfolios
                 WHERE ($1::text IS NULL OR data->>'customer_id' = $1)
                 ORDER BY data->>'created_at' DESC
                 LIMIT $2 OFFSET $3`,
          values: [customer_id ?? null, page_size, offset],
        }),
        pool.query<{ total: string }>({
          name: 'count-portfolios',
          text: `SELECT COUNT(*)::text AS total FROM portfolios
                 WHERE ($1::text IS NULL OR data->>'customer_id' = $1)`,
          values: [customer_id ?? null],
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
