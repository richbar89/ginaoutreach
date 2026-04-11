-- Support multiple subcategories and categories per contact
ALTER TABLE uploaded_contacts ADD COLUMN IF NOT EXISTS subcategories text[] DEFAULT '{}';
ALTER TABLE uploaded_contacts ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Index for array containment queries
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_subcategories ON uploaded_contacts USING GIN(subcategories);
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_categories ON uploaded_contacts USING GIN(categories);
