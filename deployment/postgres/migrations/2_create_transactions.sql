-- Up Migration

CREATE TABLE IF NOT EXISTS transactions (
  id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL
);

-- Uniqueness is enforced on (user_id, exchange, transaction_id) within the JSONB payload.
-- Partial unique index: NULLs in any key expression are excluded, so malformed records
-- without these fields won't silently collide — they simply won't be covered by the constraint.
CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_exchange_transaction_uidx
  ON transactions ((data->>'user_id'), (data->>'exchange'), (data->>'transaction_id'));

-- Down Migration

DROP TABLE IF EXISTS transactions;
