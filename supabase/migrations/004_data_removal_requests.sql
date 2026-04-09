CREATE TABLE IF NOT EXISTS data_removal_requests (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text,
  email      text        NOT NULL,
  reason     text,
  created_at timestamptz DEFAULT now(),
  resolved   boolean     DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_data_removal_email ON data_removal_requests(email);
