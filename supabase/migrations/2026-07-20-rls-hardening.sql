-- RLS hardening (2026-07-20) — from the pre-launch audit. Run in the
-- Supabase SQL editor. Idempotent; safe to run more than once.

-- ── sequence_contacts: clients may READ their own rows only ─────────
-- (wizard "in active sequence" flags + deal profile activity)
alter table sequence_contacts enable row level security;
do $$ declare p record; begin
  for p in select policyname from pg_policies where tablename = 'sequence_contacts' loop
    execute format('drop policy %I on sequence_contacts', p.policyname);
  end loop;
end $$;
create policy "own sequence contacts: select" on sequence_contacts
  for select using ((auth.jwt() ->> 'sub') = user_id);

-- ── email_log: strictly per-user, no null-user visibility ───────────
alter table email_log enable row level security;
do $$ declare p record; begin
  for p in select policyname from pg_policies where tablename = 'email_log' loop
    execute format('drop policy %I on email_log', p.policyname);
  end loop;
end $$;
create policy "own email log" on email_log
  for all using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

-- ── contact_lists: strictly per-user ────────────────────────────────
alter table contact_lists enable row level security;
do $$ declare p record; begin
  for p in select policyname from pg_policies where tablename = 'contact_lists' loop
    execute format('drop policy %I on contact_lists', p.policyname);
  end loop;
end $$;
create policy "own contact lists" on contact_lists
  for all using ((auth.jwt() ->> 'sub') = user_id)
  with check ((auth.jwt() ->> 'sub') = user_id);

-- ── server-only tables: lock browsers out entirely ──────────────────
-- (the app reaches these via service role, which bypasses RLS)
alter table user_email_accounts enable row level security;
alter table suppression_list enable row level security;
alter table media_kit_links enable row level security;
revoke all on table media_kit_links from anon;
revoke all on table media_kit_links from authenticated;
