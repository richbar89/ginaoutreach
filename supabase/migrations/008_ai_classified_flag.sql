-- Track which contacts have been AI-classified
ALTER TABLE uploaded_contacts ADD COLUMN IF NOT EXISTS ai_classified boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_uploaded_contacts_ai_classified ON uploaded_contacts(ai_classified);
