import { randomUUID } from 'crypto';
import { FastifyPluginCallback } from 'fastify';
import { pool } from '../../db';
import { PortfolioRow, rowToResponse } from '../../types/portfolio';

export const createPortfolio: FastifyPluginCallback = (fastify) => {
  fastify.post<{
    Body: {
      customer_id: string;
      name: string;
      currency: string;
    };
  }>(
    '/portfolios',
    {
      schema: {
        body: { $ref: 'CreatePortfolioRequest' },
        response: { 201: { $ref: 'Portfolio' } },
      },
    },
    async (request, reply) => {
      const { customer_id, name, currency } = request.body;
      const id = randomUUID();
      const now = new Date().toISOString();

      const result = await pool.query<PortfolioRow>({
        name: 'create-portfolio',
        text: `INSERT INTO portfolios (id, data) VALUES ($1, $2) RETURNING id, data`,
        values: [
          id,
          JSON.stringify({
            id,
            customer_id,
            name,
            currency,
            created_at: now,
            updated_at: now,
          }),
        ],
      });

      reply.code(201);
      return rowToResponse(result.rows[0]);
    },
  );
};
