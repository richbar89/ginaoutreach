-- Contacts schema v2
-- Merge industry into category, add subcategory and country

-- Drop industry column (data already in category or will be re-imported)
ALTER TABLE uploaded_contacts DROP COLUMN IF EXISTS industry;

-- Add new columns
ALTER TABLE uploaded_contacts ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE uploaded_contacts ADD COLUMN IF NOT EXISTS country text DEFAULT 'UK';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_category    ON uploaded_contacts(category);
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_subcategory ON uploaded_contacts(subcategory);
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_country     ON uploaded_contacts(country);
