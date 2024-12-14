-- Create the property_mistral_data table
create table if not exists public.property_mistral_data (
    id uuid default gen_random_uuid() primary key,
    property_id uuid references public.property_requests(id) on delete cascade,
    market_analysis text,
    price_prediction text,
    risk_assessment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.property_mistral_data enable row level security;

create policy "Allow public read access"
    on public.property_mistral_data
    for select
    to authenticated
    using (true);

create policy "Allow insert for authenticated users"
    on public.property_mistral_data
    for insert
    to authenticated
    with check (true);

create policy "Allow update for authenticated users"
    on public.property_mistral_data
    for update
    to authenticated
    using (true)
    with check (true);

-- Add indexes
create index if not exists property_mistral_data_property_id_idx
    on public.property_mistral_data(property_id);

-- Add trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_property_mistral_data_updated_at
    before update on public.property_mistral_data
    for each row
    execute procedure public.handle_updated_at();
