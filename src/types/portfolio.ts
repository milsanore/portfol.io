export interface Portfolio {
  customer_id: string;
  name: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioRow {
  id: string;
  data: Portfolio;
}

export function rowToResponse(row: PortfolioRow): Portfolio & { id: string } {
  return { id: row.id, ...row.data };
}
