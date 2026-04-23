create table if not exists meta_connections (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null unique,
  access_token text not null,
  page_id     text,
  page_name   text,
  ig_account_id text,
  expires_at  timestamptz,
  connected_at timestamptz not null default now()
);

alter table meta_connections enable row level security;

-- Users can only read/write their own connection
drop policy if exists "own meta connection" on meta_connections;
create policy "own meta connection" on meta_connections for all
  using ((auth.jwt() ->> 'sub') = user_id);
