-- Nylas migration (2026-07-19)
-- Run in the Supabase SQL editor before deploying the Nylas build.

-- The connected account is now a Nylas grant, not a Gmail App Password.
-- gmail_email / app_password columns are left in place for existing rows;
-- the code no longer reads them, and users reconnect via hosted OAuth.
alter table user_email_accounts
  add column if not exists email text,
  add column if not exists nylas_grant_id text;

-- Follow-up emails thread onto the initial send via its provider message id.
alter table sequence_contacts
  add column if not exists last_message_id text;
