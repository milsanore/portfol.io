export interface Portfolio {
  id: string;
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

export function rowToResponse(row: PortfolioRow): Portfolio {
  return { ...row.data, id: row.id };
}
