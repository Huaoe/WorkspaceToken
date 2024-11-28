-- Add token fields to property_requests table
ALTER TABLE property_requests
ADD COLUMN IF NOT EXISTS token_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS token_symbol VARCHAR(10);

-- Update existing rows with default values
UPDATE property_requests
SET 
  token_name = CONCAT(title, ' Token'),
  token_symbol = LEFT(REGEXP_REPLACE(UPPER(title), '[^A-Z]', ''), 5)
WHERE token_name IS NULL OR token_symbol IS NULL;
