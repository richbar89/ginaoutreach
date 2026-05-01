-- Add user_id to email_log if not already present.
-- Made nullable because historical rows predate this column.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'email_log' and column_name = 'user_id'
  ) then
    alter table email_log add column user_id text;
  end if;
end $$;

-- RLS policy so users only see their own emails (no-op if email_log already has one)
drop policy if exists "own email_log" on email_log;
create policy "own email_log" on email_log for all
  using (user_id is null or (auth.jwt() ->> 'sub') = user_id);
