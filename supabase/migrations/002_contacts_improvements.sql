-- Add industry column to uploaded_contacts (needed for leads migration)
alter table uploaded_contacts add column if not exists industry text;

-- Indexes for search performance
create index if not exists idx_uploaded_contacts_company on uploaded_contacts(company);
create index if not exists idx_uploaded_contacts_email   on uploaded_contacts(lower(email));
create index if not exists idx_uploaded_contacts_name    on uploaded_contacts(lower(name));
