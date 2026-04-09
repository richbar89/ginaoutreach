-- Shareable media kit snapshots
-- Each row is a point-in-time snapshot of a user's media kit, accessible via a short token.
-- No auth required to read (anon), but only the backend service role can write.

CREATE TABLE IF NOT EXISTS media_kit_links (
  id         text PRIMARY KEY,          -- short random token (12 chars)
  data       jsonb NOT NULL,            -- full MediaKit snapshot
  created_at timestamptz DEFAULT now()
);

-- Allow anyone to read (public media kit links)
GRANT SELECT ON TABLE media_kit_links TO anon;
-- Allow service role to insert/update (server-side only)
GRANT INSERT, UPDATE ON TABLE media_kit_links TO service_role;
