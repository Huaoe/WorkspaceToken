-- Add token_address column to property_requests table
ALTER TABLE property_requests
ADD COLUMN IF NOT EXISTS token_address TEXT;
