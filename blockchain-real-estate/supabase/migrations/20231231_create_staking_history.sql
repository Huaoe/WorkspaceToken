-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('stake', 'reward', 'withdraw');

-- Enable Row Level Security
ALTER TABLE IF EXISTS staking_history ENABLE ROW LEVEL SECURITY;

-- Create staking_history table
CREATE TABLE IF NOT EXISTS staking_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_address TEXT NOT NULL,
    property_token TEXT NOT NULL,
    amount DECIMAL(36,18) NOT NULL,
    transaction_hash TEXT UNIQUE NOT NULL,
    block_number BIGINT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    type transaction_type NOT NULL,
    
    -- Optional metadata
    gas_used DECIMAL(36,18),
    gas_price DECIMAL(36,18),
    block_hash TEXT,
    status TEXT DEFAULT 'confirmed',

    -- Constraints
    CONSTRAINT valid_eth_address CHECK (user_address ~* '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_token_address CHECK (property_token ~* '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_tx_hash CHECK (transaction_hash ~* '^0x[a-fA-F0-9]{64}$')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_staking_history_user_address 
    ON staking_history(user_address);
CREATE INDEX IF NOT EXISTS idx_staking_history_property_token 
    ON staking_history(property_token);
CREATE INDEX IF NOT EXISTS idx_staking_history_timestamp 
    ON staking_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_staking_history_type 
    ON staking_history(type);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_staking_history_user_property 
    ON staking_history(user_address, property_token);

-- Add comments for documentation
COMMENT ON TABLE staking_history IS 'Records of all staking, reward, and withdrawal transactions';
COMMENT ON COLUMN staking_history.user_address IS 'Ethereum address of the user who performed the action';
COMMENT ON COLUMN staking_history.property_token IS 'Address of the property token contract';
COMMENT ON COLUMN staking_history.amount IS 'Amount of tokens staked/rewarded/withdrawn';
COMMENT ON COLUMN staking_history.transaction_hash IS 'Ethereum transaction hash';
COMMENT ON COLUMN staking_history.timestamp IS 'Timestamp when the transaction occurred';
COMMENT ON COLUMN staking_history.type IS 'Type of transaction: stake, reward, or withdraw';

-- Create RLS policies
CREATE POLICY "Enable read access for all users"
    ON staking_history FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only"
    ON staking_history FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create a view for aggregated staking data
CREATE OR REPLACE VIEW staking_summary AS
SELECT 
    user_address,
    property_token,
    SUM(CASE WHEN type = 'stake' THEN amount ELSE 0 END) as total_staked,
    SUM(CASE WHEN type = 'reward' THEN amount ELSE 0 END) as total_rewards,
    SUM(CASE WHEN type = 'withdraw' THEN amount ELSE 0 END) as total_withdrawn,
    COUNT(*) as total_transactions,
    MAX(timestamp) as last_activity
FROM staking_history
GROUP BY user_address, property_token;

-- Create a function to get user's staking history
CREATE OR REPLACE FUNCTION get_user_staking_history(
    p_user_address TEXT,
    p_property_token TEXT DEFAULT NULL
)
RETURNS TABLE (
    transaction_date TIMESTAMP WITH TIME ZONE,
    transaction_type transaction_type,
    amount DECIMAL(36,18),
    property_token TEXT,
    transaction_hash TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sh.timestamp as transaction_date,
        sh.type as transaction_type,
        sh.amount,
        sh.property_token,
        sh.transaction_hash
    FROM staking_history sh
    WHERE sh.user_address = p_user_address
    AND (p_property_token IS NULL OR sh.property_token = p_property_token)
    ORDER BY sh.timestamp DESC;
END;
$$;
