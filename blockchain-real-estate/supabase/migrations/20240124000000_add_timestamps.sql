-- Add timestamp columns to property_requests table
ALTER TABLE property_requests
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_property_requests_updated_at ON property_requests;
CREATE TRIGGER update_property_requests_updated_at
    BEFORE UPDATE ON property_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS on property_requests table
ALTER TABLE property_requests DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXconst price = BigInt(propertyData.expected_price) * BigInt(10 ** 6); // Convert to 6 decimals for EURCISTS "Users can view their own requests" ON property_requests;
DROP POLICY IF EXISTS "Users can insert their own requests" ON property_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON property_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON property_requests;
DROP POLICY IF EXISTS "Admins can update all requests" ON property_requests;
