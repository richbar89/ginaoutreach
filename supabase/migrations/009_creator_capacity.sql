-- Creator capacity table (manually managed by admin)
-- Stores filled/cap counts per creator vertical for landing page urgency bars

create table if not exists creator_capacity (
  category   text primary key,  -- 'foodie' | 'lifestyle' | 'beauty' | 'fitness'
  label      text not null,
  emoji      text not null,
  filled     integer not null default 0,
  cap        integer not null default 100,
  updated_at timestamptz not null default now()
);

-- Public read (landing page needs it unauthenticated)
alter table creator_capacity enable row level security;
drop policy if exists "Public can read capacity" on creator_capacity;
create policy "Public can read capacity" on creator_capacity for select using (true);

-- Seed defaults
insert into creator_capacity (category, label, emoji, filled, cap)
values
  ('foodie',    'Foodies',   '🍔', 23, 100),
  ('lifestyle', 'Lifestyle', '✨',  8, 100),
  ('beauty',    'Beauty',    '💄',  5, 100),
  ('fitness',   'Fitness',   '💪',  3, 100)
on conflict (category) do nothing;

-- Add creator_type to user_settings
alter table user_settings add column if not exists creator_type text;
