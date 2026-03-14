import { FastifyPluginCallback } from 'fastify';
import { pool } from '../../db';
import { PortfolioRow, rowToResponse } from '../../types/portfolio';

export const updatePortfolio: FastifyPluginCallback = (fastify) => {
  fastify.patch<{
    Params: { id: string };
    Body: { name?: string; currency?: string };
  }>(
    '/portfolios/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        body: { $ref: 'UpdatePortfolioRequest' },
        response: {
          200: { $ref: 'Portfolio' },
          404: { $ref: 'ErrorResponse' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { name, currency } = request.body;

      const patch: Record<string, string> = { updated_at: new Date().toISOString() };
      if (name !== undefined) patch.name = name;
      if (currency !== undefined) patch.currency = currency;

      const result = await pool.query<PortfolioRow>({
        name: 'update-portfolio',
        text: `UPDATE portfolios SET data = data || $2::jsonb WHERE id = $1 RETURNING id, data`,
        values: [id, JSON.stringify(patch)],
      });

      if (result.rows.length === 0) {
        reply.code(404);
        return { error: 'Portfolio not found' };
      }

      return rowToResponse(result.rows[0]);
    },
  );
};
