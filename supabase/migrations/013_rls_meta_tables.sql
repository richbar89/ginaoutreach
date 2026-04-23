-- meta_ad_statuses and meta_page_ids are admin/internal tables.
-- Service role (used by API routes) bypasses RLS.
-- No client policies = all direct client access blocked.

alter table meta_ad_statuses enable row level security;
alter table meta_page_ids enable row level security;
