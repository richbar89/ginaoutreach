-- Enable RLS on tables that were missing it.
-- All trend/refresh tables are admin-only (service role bypasses RLS).
-- No client policies needed — blocks all anon/authenticated client access.

alter table trend_influencers enable row level security;
alter table trend_posts enable row level security;
alter table trend_refresh_log enable row level security;

-- data_removal_requests: allow anonymous inserts (GDPR removal requests
-- come from unauthenticated visitors). Reads/updates are admin-only (service role).
alter table data_removal_requests enable row level security;

drop policy if exists "Anyone can submit data removal request" on data_removal_requests;
create policy "Anyone can submit data removal request"
  on data_removal_requests for insert
  with check (true);

-- waitlist: allow anonymous inserts (public signup form).
-- Reads/deletes are admin-only (service role).
alter table waitlist enable row level security;

drop policy if exists "Anyone can join waitlist" on waitlist;
create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);
