-- Up Migration

CREATE TABLE IF NOT EXISTS trades (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL
);

-- Uniqueness is enforced on (userId, exchange, tradeId) within the JSONB payload.
-- Partial unique index: NULLs in any key expression are excluded, so malformed records
-- without these fields won't silently collide — they simply won't be covered by the constraint.
CREATE UNIQUE INDEX IF NOT EXISTS trades_user_exchange_trade_uidx
  ON trades ((data->>'userId'), (data->>'exchange'), (data->>'tradeId'));

-- Down Migration

DROP TABLE IF EXISTS trades;
