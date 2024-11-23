-- Add number_of_tokens column to property_requests table
ALTER TABLE property_requests 
ADD COLUMN IF NOT EXISTS number_of_tokens INTEGER NOT NULL DEFAULT 100 
CHECK (number_of_tokens >= 1 AND number_of_tokens <= 10000);

-- Add comment for the new column
COMMENT ON COLUMN property_requests.number_of_tokens IS 'Number of tokens to be created for the property';
