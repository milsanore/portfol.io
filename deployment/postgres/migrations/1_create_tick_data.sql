-- Up Migration

CREATE TABLE IF NOT EXISTS tick_data (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL
);

-- Composite index: unique_symbol first (high cardinality → eliminates most rows on ticker lookup),
-- then pricing_date for efficient range scans within a symbol.
-- Trade-off: a date-only range scan (no ticker filter) won't benefit from this index;
-- add a separate index on (data->>'pricing_date') if that query pattern emerges.
CREATE INDEX IF NOT EXISTS tick_data_symbol_date_idx
  ON tick_data ((data->>'unique_symbol'), (data->>'pricing_date'));

-- Down Migration

DROP TABLE IF EXISTS tick_data;
