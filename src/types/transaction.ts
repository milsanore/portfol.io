export interface Transaction {
  portfolio_id: string;
  ticker: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  currency: string;
  exchange?: string;
  transaction_id?: string;
  date?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionRow {
  id: string;
  data: Transaction;
}

export function rowToResponse(row: TransactionRow): Transaction & { id: string } {
  return { id: row.id, ...row.data };
}
