-- Drop existing types if they exist
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'employment_status') then
        create type employment_status as enum (
            'employed',
            'self_employed',
            'unemployed',
            'student',
            'retired'
        );
    end if;

    if not exists (select 1 from pg_type where typname = 'trading_experience') then
        create type trading_experience as enum (
            'none',
            'beginner',
            'intermediate',
            'advanced',
            'expert'
        );
    end if;
end $$;

-- Drop existing table if exists
drop table if exists public.kyc_submissions;

-- Create KYC submissions table
create table public.kyc_submissions (
    id uuid default gen_random_uuid() primary key,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    
    -- Personal Information
    salutation text,
    first_name text,
    middle_name text,
    last_name text,
    date_of_birth date,
    nationality text,
    country_of_residence text,
    
    -- Contact Details
    email text,
    phone_country_code text,
    phone_number text,
    
    -- Address Information
    street_address text,
    city text,
    state text,
    postal_code text,
    country text,
    
    -- Identification
    identification_type text,
    identification_number text,
    identification_issue_date date,
    identification_expiry_date date,
    
    -- Financial Profile
    employment_status employment_status,
    source_of_funds text,
    annual_income numeric,
    
    -- Blockchain Specifics
    wallet_address text not null unique,
    primary_blockchain_network text,
    trading_experience trading_experience,
    purpose_of_trading text,
    
    -- Document References
    identity_proof_url text,
    address_proof_url text,
    additional_document_url text,
    
    -- Status
    status text default 'pending',
    
    constraint valid_email check (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- Create storage bucket for KYC documents if it doesn't exist
insert into storage.buckets (id, name, public)
values ('kyc_documents', 'kyc_documents', true)
on conflict (id) do update set public = true;

-- Disable RLS for storage
alter table storage.objects disable row level security;

-- Drop existing policies if they exist
do $$ 
begin
    -- Drop KYC table policies
    drop policy if exists "Users can view own KYC" on public.kyc_submissions;
    drop policy if exists "Users can insert own KYC" on public.kyc_submissions;
    drop policy if exists "Users can update own KYC" on public.kyc_submissions;
    
    -- Drop storage policies
    drop policy if exists "Users can upload their own KYC documents" on storage.objects;
    drop policy if exists "Users can update their own KYC documents" on storage.objects;
    drop policy if exists "Users can read their own KYC documents" on storage.objects;
    drop policy if exists "Users can delete their own KYC documents" on storage.objects;
    drop policy if exists "Anyone can upload KYC documents" on storage.objects;
    drop policy if exists "Anyone can read KYC documents" on storage.objects;
end $$;

-- Create KYC table policies
create policy "Anyone can insert KYC"
    on public.kyc_submissions for insert
    with check (true);

create policy "Users can view own KYC"
    on public.kyc_submissions for select
    using (true);

create policy "Users can update own KYC"
    on public.kyc_submissions for update
    using (true);

-- Enable RLS for KYC table
alter table public.kyc_submissions enable row level security;

-- Create or replace function to automatically update updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Drop trigger if exists and create it
drop trigger if exists update_kyc_submissions_updated_at on public.kyc_submissions;
create trigger update_kyc_submissions_updated_at
    before update on public.kyc_submissions
    for each row
    execute function update_updated_at_column();
