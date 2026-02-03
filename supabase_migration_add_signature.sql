-- Add signature column to business_profile table
-- Run this in your Supabase SQL Editor

ALTER TABLE business_profile 
ADD COLUMN IF NOT EXISTS signature TEXT;

-- Add comment to document the column
COMMENT ON COLUMN business_profile.signature IS 'Base64 encoded signature image for invoices';
