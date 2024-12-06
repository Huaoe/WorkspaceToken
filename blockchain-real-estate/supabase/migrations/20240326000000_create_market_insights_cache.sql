-- Create market insights cache table
create table if not exists market_insights_cache (
  id uuid default gen_random_uuid() primary key,
  location text not null unique,
  insights text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on location for faster lookups
create index if not exists market_insights_cache_location_idx on market_insights_cache (location);

-- Add RLS policies
alter table market_insights_cache enable row level security;

-- Allow public read access
create policy "Allow public read access"
  on market_insights_cache
  for select
  to public
  using (true);

-- Allow service role to insert/update
create policy "Allow service role to manage cache"
  on market_insights_cache
  for all
  to service_role
  using (true)
  with check (true);
