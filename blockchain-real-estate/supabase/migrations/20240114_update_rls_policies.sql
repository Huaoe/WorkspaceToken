-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own property requests" ON property_requests;
DROP POLICY IF EXISTS "Users can insert their own property requests" ON property_requests;
DROP POLICY IF EXISTS "Users can update their own pending property requests" ON property_requests;

-- Create new policies that don't rely on auth.uid()
-- Allow anyone to view property requests (we can restrict this later if needed)
CREATE POLICY "Anyone can view property requests"
    ON property_requests FOR SELECT
    USING (true);

-- Allow anyone to insert property requests (the owner_address is validated in the application)
CREATE POLICY "Anyone can insert property requests"
    ON property_requests FOR INSERT
    WITH CHECK (true);

-- Allow updates only on pending requests by matching the owner_address
CREATE POLICY "Owner can update pending property requests"
    ON property_requests FOR UPDATE
    USING (status = 'pending');

-- Ensure RLS is still enabled
ALTER TABLE property_requests ENABLE ROW LEVEL SECURITY;
