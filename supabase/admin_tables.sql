-- Admin tables migration
-- Run this in Supabase SQL editor

-- ── Tickets ────────────────────────────────────────────────────
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text not null,
  brand_name text not null,
  brand_url text not null,
  notes text,
  status text not null default 'pending', -- pending | in_progress | done | rejected
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table tickets enable row level security;

create policy "Users can insert own tickets"
  on tickets for insert
  with check (user_id = auth.jwt() ->> 'sub');

create policy "Users can read own tickets"
  on tickets for select
  using (user_id = auth.jwt() ->> 'sub');

-- ── Error Logs ─────────────────────────────────────────────────
create table if not exists error_logs (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  context jsonb,
  user_id text,
  level text default 'error', -- error | warn | info
  path text,
  resolved boolean default false,
  created_at timestamptz default now()
);

alter table error_logs enable row level security;

create policy "Anyone authenticated can insert error logs"
  on error_logs for insert
  with check (auth.jwt() ->> 'sub' is not null);

-- ── Announcements ──────────────────────────────────────────────
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  type text default 'info', -- info | warning | success
  active boolean default true,
  created_at timestamptz default now(),
  expires_at timestamptz
);

alter table announcements enable row level security;

create policy "Anyone authenticated can read active announcements"
  on announcements for select
  using (active = true and (expires_at is null or expires_at > now()));

-- ── Uploaded Contacts ──────────────────────────────────────────
create table if not exists uploaded_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  position text,
  company text,
  linkedin text,
  notes text,
  category text,
  created_at timestamptz default now()
);

alter table uploaded_contacts enable row level security;

create policy "Anyone authenticated can read uploaded contacts"
  on uploaded_contacts for select
  using (auth.jwt() ->> 'sub' is not null);
