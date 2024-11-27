-- Create property_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS property_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    expected_price TEXT NOT NULL,
    documents_url TEXT,
    owner_address VARCHAR(42) NOT NULL,
    number_of_tokens INTEGER NOT NULL,
    token_address TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    payout_duration INTEGER NOT NULL CHECK (payout_duration > 0),
    finish_at DATE NOT NULL,
    roi DECIMAL(5, 2) NOT NULL
);

-- Add constraint to payout_duration if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.check_constraints
        WHERE constraint_name = 'payout_duration_positive'
    ) THEN
        ALTER TABLE property_requests
        ADD CONSTRAINT payout_duration_positive CHECK (payout_duration > 0);
    END IF;
END $$;

-- Create updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_property_requests_updated_at') THEN
        CREATE TRIGGER update_property_requests_updated_at
            BEFORE UPDATE ON property_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
