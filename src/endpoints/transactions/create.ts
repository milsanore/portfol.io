import { randomUUID } from 'crypto';
import { FastifyPluginCallback } from 'fastify';
import { pool } from '../../db';
import { TransactionRow, rowToResponse } from '../../types/transaction';

export const createTransaction: FastifyPluginCallback = (fastify) => {
  fastify.post<{
    Params: { portfolio_id: string };
    Body: {
      unique_symbol: string;
      side: 'buy' | 'sell';
      amount: number;
      price: number;
      currency: string;
      exchange?: string;
      transaction_id?: string;
      date?: string;
    };
  }>(
    '/portfolios/:portfolio_id/transactions',
    {
      schema: {
        params: { $ref: 'TransactionCollectionParams' },
        body: { $ref: 'CreateTransactionRequest' },
        response: { 201: { $ref: 'Transaction' } },
      },
    },
    async (request, reply) => {
      const { portfolio_id } = request.params;
      const { unique_symbol, side, amount, price, currency, exchange, transaction_id, date } =
        request.body;
      const id = randomUUID();
      const now = new Date().toISOString();

      const data: Record<string, unknown> = {
        id,
        portfolio_id,
        unique_symbol,
        side,
        amount,
        price,
        currency,
        created_at: now,
        updated_at: now,
      };
      if (exchange !== undefined) data.exchange = exchange;
      if (transaction_id !== undefined) data.transaction_id = transaction_id;
      if (date !== undefined) data.date = date;

      const result = await pool.query<TransactionRow>({
        name: 'create-transaction',
        text: `INSERT INTO transactions (id, portfolio_id, data) VALUES ($1, $2, $3) RETURNING id, data`,
        values: [id, portfolio_id, JSON.stringify(data)],
      });

      reply.code(201);
      return rowToResponse(result.rows[0]);
    },
  );
};
