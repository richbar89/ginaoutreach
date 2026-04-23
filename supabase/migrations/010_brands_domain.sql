-- Add domain column to brands table for instant logo resolution
ALTER TABLE brands ADD COLUMN IF NOT EXISTS domain text;
