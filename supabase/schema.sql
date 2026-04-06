-- ─────────────────────────────────────────────────────────────
-- Outreach SaaS — Supabase schema
-- user_id is the Clerk user ID (e.g. "user_2abc...")
-- Safe to re-run: drops existing policies before recreating
-- ─────────────────────────────────────────────────────────────

-- Campaigns
create table if not exists campaigns (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  name         text not null default '',
  subject      text not null default '',
  body         text not null default '',
  contacts     jsonb not null default '[]',
  created_at   timestamptz not null default now()
);
alter table campaigns enable row level security;
drop policy if exists "own campaigns" on campaigns;
create policy "own campaigns" on campaigns for all
  using ((auth.jwt() ->> 'sub') = user_id);

-- Email log
create table if not exists email_log (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  contact_email  text not null,
  subject        text not null default '',
  body           text not null default '',
  sent_at        timestamptz not null default now(),
  campaign_id    uuid,
  campaign_name  text
);
alter table email_log enable row level security;
drop policy if exists "own email_log" on email_log;
create policy "own email_log" on email_log for all
  using ((auth.jwt() ->> 'sub') = user_id);

-- Deals
create table if not exists deals (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  contact_email  text not null default '',
  contact_name   text not null default '',
  company        text not null default '',
  status         text not null default 'pitched',
  value          text,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table deals enable row level security;
drop policy if exists "own deals" on deals;
create policy "own deals" on deals for all
  using ((auth.jwt() ->> 'sub') = user_id);

-- Email templates
create table if not exists templates (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  name        text not null default '',
  subject     text not null default '',
  body        text not null default '',
  created_at  timestamptz not null default now()
);
alter table templates enable row level security;
drop policy if exists "own templates" on templates;
create policy "own templates" on templates for all
  using ((auth.jwt() ->> 'sub') = user_id);

-- Scheduled posts
create table if not exists scheduled_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  date        text not null,
  time        text,
  platforms   jsonb not null default '[]',
  media_type  text not null default 'photo',
  caption     text,
  status      text not null default 'idea',
  notes       text,
  created_at  timestamptz not null default now()
);
alter table scheduled_posts enable row level security;
drop policy if exists "own scheduled_posts" on scheduled_posts;
create policy "own scheduled_posts" on scheduled_posts for all
  using ((auth.jwt() ->> 'sub') = user_id);

-- Brands to monitor
create table if not exists brands (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  name         text not null,
  running_ads  boolean not null default false
);
alter table brands enable row level security;
drop policy if exists "own brands" on brands;
create policy "own brands" on brands for all
  using ((auth.jwt() ->> 'sub') = user_id);

-- Per-user settings (signature + media kit stored as jsonb)
create table if not exists user_settings (
  user_id    text primary key,
  signature  text not null default '',
  media_kit  jsonb not null default '{}'
);
alter table user_settings enable row level security;
drop policy if exists "own settings" on user_settings;
create policy "own settings" on user_settings for all
  using ((auth.jwt() ->> 'sub') = user_id);

