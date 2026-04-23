create table if not exists waitlist (
  id         uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name  text not null,
  email      text not null unique,
  niche      text not null,
  created_at timestamptz not null default now()
);

create index if not exists waitlist_created_at_idx on waitlist (created_at desc);
create index if not exists waitlist_niche_idx on waitlist (niche);
