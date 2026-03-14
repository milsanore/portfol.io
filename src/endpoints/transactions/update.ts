import { FastifyPluginCallback } from 'fastify';
import { pool } from '../../db';
import { TransactionRow, rowToResponse } from '../../types/transaction';

export const updateTransaction: FastifyPluginCallback = (fastify) => {
  fastify.patch<{
    Params: { portfolio_id: string; id: string };
    Body: {
      unique_symbol?: string;
      side?: 'buy' | 'sell';
      size?: number;
      price?: number;
      currency?: string;
      exchange?: string;
      transaction_id?: string;
      date?: string;
    };
  }>(
    '/portfolios/:portfolio_id/transactions/:id',
    {
      schema: {
        params: { $ref: 'TransactionParams' },
        body: { $ref: 'UpdateTransactionRequest' },
        response: {
          200: { $ref: 'Transaction' },
          404: { $ref: 'ErrorResponse' },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { unique_symbol, side, size, price, currency, exchange, transaction_id, date } =
        request.body;

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (unique_symbol !== undefined) patch.unique_symbol = unique_symbol;
      if (side !== undefined) patch.side = side;
      if (size !== undefined) patch.size = size;
      if (price !== undefined) patch.price = price;
      if (currency !== undefined) patch.currency = currency;
      if (exchange !== undefined) patch.exchange = exchange;
      if (transaction_id !== undefined) patch.transaction_id = transaction_id;
      if (date !== undefined) patch.date = date;

      const result = await pool.query<TransactionRow>({
        name: 'update-transaction',
        text: `UPDATE transactions SET data = data || $2::jsonb WHERE id = $1 RETURNING id, data`,
        values: [id, JSON.stringify(patch)],
      });

      if (result.rows.length === 0) {
        reply.code(404);
        return { error: 'Transaction not found' };
      }

      return rowToResponse(result.rows[0]);
    },
  );
};
