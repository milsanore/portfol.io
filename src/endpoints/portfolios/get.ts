import { FastifyPluginCallback } from 'fastify';
import { pool } from '../../db';
import { PortfolioRow, rowToResponse } from '../../types/portfolio';

export const getPortfolio: FastifyPluginCallback = (fastify) => {
  fastify.get<{ Params: { id: string } }>(
    '/portfolios/:id',
    {
      schema: {
        params: { $ref: 'PortfolioParams' },
        response: {
          200: { $ref: 'Portfolio' },
          404: { $ref: 'ErrorResponse' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const result = await pool.query<PortfolioRow>({
        name: 'get-portfolio',
        text: 'SELECT id, data FROM portfolios WHERE id = $1',
        values: [id],
      });

      if (result.rows.length === 0) {
        reply.code(404);
        return { error: 'Portfolio not found' };
      }

      return rowToResponse(result.rows[0]);
    },
  );
};
