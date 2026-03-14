import { FastifyPluginCallback } from 'fastify';
import { pool } from '../../db';
import { TransactionRow, rowToResponse } from '../../types/transaction';

export const getTransaction: FastifyPluginCallback = (fastify) => {
  fastify.get<{ Params: { portfolio_id: string; id: string } }>(
    '/portfolios/:portfolio_id/transactions/:id',
    {
      schema: {
        params: { $ref: 'TransactionParams' },
        response: {
          200: { $ref: 'Transaction' },
          404: { $ref: 'ErrorResponse' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const result = await pool.query<TransactionRow>({
        name: 'get-transaction',
        text: `SELECT id, data FROM transactions WHERE id = $1`,
        values: [id],
      });

      if (result.rows.length === 0) {
        reply.code(404);
        return { error: 'Transaction not found' };
      }

      return rowToResponse(result.rows[0]);
    },
  );
};
