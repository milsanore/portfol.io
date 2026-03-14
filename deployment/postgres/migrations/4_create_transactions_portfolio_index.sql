-- Up Migration

-- Composite index on portfolio_id + effective date (falls back to created_at when date is absent)
-- Supports efficient filtering and ordering in GET /portfolios/:portfolio_id/transactions
CREATE INDEX IF NOT EXISTS transactions_portfolio_date_idx
  ON transactions (
    (data->>'portfolio_id'),
    (COALESCE(data->>'date', data->>'created_at'))
  );

-- Down Migration

DROP INDEX IF EXISTS transactions_portfolio_date_idx;
