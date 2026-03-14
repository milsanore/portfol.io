-- Up Migration

CREATE TABLE IF NOT EXISTS portfolios (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL
);

-- Index on customer_id for efficient customer portfolio lookups.
CREATE INDEX IF NOT EXISTS portfolios_customer_id_idx
  ON portfolios ((data->>'customer_id'));

-- Down Migration

DROP TABLE IF EXISTS portfolios;
