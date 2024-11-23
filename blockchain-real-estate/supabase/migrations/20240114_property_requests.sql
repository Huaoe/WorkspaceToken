-- Create the property_requests table
CREATE TABLE IF NOT EXISTS property_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Property Details
    title VARCHAR(50) NOT NULL,
    description TEXT NOT NULL CHECK (char_length(description) <= 500),
    location VARCHAR(256) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    expected_price DECIMAL(20, 8) NOT NULL CHECK (expected_price > 0),
    documents_url VARCHAR(500),
    
    -- Blockchain Details
    owner_address VARCHAR(42) NOT NULL CHECK (owner_address ~ '^0x[a-fA-F0-9]{40}$'),
    number_of_tokens INTEGER NOT NULL CHECK (number_of_tokens >= 1 AND number_of_tokens <= 10000),
    
    -- Request Status
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'tokenized')),
    
    -- Timestamps for status changes
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    tokenized_at TIMESTAMP WITH TIME ZONE
);

-- Create index on owner_address for faster queries
CREATE INDEX IF NOT EXISTS idx_property_requests_owner_address ON property_requests(owner_address);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_property_requests_status ON property_requests(status);

-- Add a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_requests_updated_at
    BEFORE UPDATE ON property_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) policies
ALTER TABLE property_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own property requests
CREATE POLICY "Users can view their own property requests"
    ON property_requests FOR SELECT
    USING (auth.uid()::text = owner_address);

-- Allow users to insert their own property requests
CREATE POLICY "Users can insert their own property requests"
    ON property_requests FOR INSERT
    WITH CHECK (auth.uid()::text = owner_address);

-- Allow users to update their own pending property requests
CREATE POLICY "Users can update their own pending property requests"
    ON property_requests FOR UPDATE
    USING (auth.uid()::text = owner_address AND status = 'pending');

-- Comments for better understanding
COMMENT ON TABLE property_requests IS 'Stores property tokenization requests from users';
COMMENT ON COLUMN property_requests.id IS 'Unique identifier for the property request';
COMMENT ON COLUMN property_requests.title IS 'Title of the property (3-50 characters)';
COMMENT ON COLUMN property_requests.description IS 'Detailed description of the property (10-500 characters)';
COMMENT ON COLUMN property_requests.location IS 'Physical location of the property';
COMMENT ON COLUMN property_requests.image_url IS 'URL to the main image of the property';
COMMENT ON COLUMN property_requests.expected_price IS 'Expected price in ETH';
COMMENT ON COLUMN property_requests.documents_url IS 'Optional URL to additional property documents';
COMMENT ON COLUMN property_requests.owner_address IS 'Ethereum address of the property owner';
COMMENT ON COLUMN property_requests.number_of_tokens IS 'Number of tokens to be created for the property';
COMMENT ON COLUMN property_requests.status IS 'Current status of the property request';
COMMENT ON COLUMN property_requests.approved_at IS 'Timestamp when the request was approved';
COMMENT ON COLUMN property_requests.rejected_at IS 'Timestamp when the request was rejected';
COMMENT ON COLUMN property_requests.tokenized_at IS 'Timestamp when the property was tokenized';
