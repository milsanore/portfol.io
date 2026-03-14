export interface Transaction {
  id: string;
  portfolio_id: string;
  unique_symbol: string;
  side: 'buy' | 'sell';
  size: number;
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

export function rowToResponse(row: TransactionRow): Transaction {
  return { ...row.data, id: row.id };
}
