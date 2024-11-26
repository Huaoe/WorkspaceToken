-- Create the properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    image_url TEXT,
    token_address TEXT NOT NULL UNIQUE,
    price_per_token DECIMAL(20, 6) NOT NULL,
    total_tokens BIGINT NOT NULL,
    available_tokens BIGINT NOT NULL,
    owner_address TEXT NOT NULL
);

-- Create an index on token_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_properties_token_address ON public.properties(token_address);

-- Add example property for testing
INSERT INTO public.properties (
    title,
    description,
    location,
    image_url,
    token_address,
    price_per_token,
    total_tokens,
    available_tokens,
    owner_address
) VALUES (
    'Luxury Villa in Miami',
    'Beautiful luxury villa with ocean view, featuring 5 bedrooms and a private pool',
    'Miami, Florida',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1000&auto=format&fit=crop',
    '0x5392A33F7F677f59e833FEBF4016cDDD88fF9E67',
    5.000000,
    1000,
    1000,
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
);