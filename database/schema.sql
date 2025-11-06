-- ============================================================================
-- USAC RHC Outreach Automation - Supabase Database Schema
-- ============================================================================
-- Version: 1.0
-- Date: 2025-11-05
-- Description: Complete PostgreSQL schema for USAC RHC clinic tracking,
--              enrichment, and outreach automation
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- ============================================================================
-- Clinics Pending Review
-- Main table for tracking new Form 465 filings and their processing status
-- ============================================================================
create table public.clinics_pending_review (
  -- Primary key
  id uuid default uuid_generate_v4() primary key,

  -- Basic clinic info
  hcp_number text not null,
  clinic_name text not null,
  address text,
  city text,
  state text not null,
  filing_date timestamptz not null,

  -- Deduplication hash (HCP number + date + address)
  form_465_hash text unique not null,

  -- Extracted from PDF
  service_type text,
  contract_length integer,
  bandwidth text,

  -- Ranking and scoring
  priority_score integer check (priority_score between 1 and 100),
  priority_label text check (priority_label in ('High', 'Medium', 'Low')),
  total_funding_3y numeric(12, 2),
  location_count integer default 1,
  participation_years integer,

  -- Enrichment data
  enriched boolean default false,
  contact_name text,
  contact_title text,
  contact_email text,
  clinic_website text,
  linkedin_url text,
  enrichment_date timestamptz,

  -- Processing status
  processed boolean default false,
  assigned_to text,
  email_draft_created boolean default false,
  notes text,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- Historical USAC Filings
-- Stores past Form 466, 467 data for scoring and ranking lookups
-- ============================================================================
create table public.usac_historical_filings (
  id uuid default uuid_generate_v4() primary key,
  hcp_number text not null,
  form_type text not null check (form_type in ('466', '467', '465')),
  filing_year integer not null check (filing_year >= 2020 and filing_year <= 2030),
  funding_amount numeric(12, 2),
  location_name text,
  service_details jsonb,
  created_at timestamptz default now()
);

-- ============================================================================
-- System Alerts
-- Stores USAC rule updates and system notifications for dashboard display
-- ============================================================================
create table public.system_alerts (
  id uuid default uuid_generate_v4() primary key,
  alert_type text not null check (alert_type in ('usac_rule_update', 'system_error', 'workflow_notification')),
  title text not null,
  message text,
  url text,
  severity text default 'info' check (severity in ('info', 'warning', 'error')),
  read boolean default false,
  created_at timestamptz default now(),
  expires_at timestamptz
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Clinics pending review indexes
create index clinics_state_idx on public.clinics_pending_review(state);
create index clinics_priority_idx on public.clinics_pending_review(priority_score desc);
create index clinics_processed_idx on public.clinics_pending_review(processed, created_at desc);
create index clinics_hcp_number_idx on public.clinics_pending_review(hcp_number);
create index clinics_filing_date_idx on public.clinics_pending_review(filing_date desc);
create index clinics_enriched_idx on public.clinics_pending_review(enriched) where not processed;

-- Historical filings indexes
create index usac_historical_hcp_idx on public.usac_historical_filings(hcp_number);
create index usac_historical_year_idx on public.usac_historical_filings(filing_year desc);
create index usac_historical_form_type_idx on public.usac_historical_filings(form_type);
create index usac_historical_composite_idx on public.usac_historical_filings(hcp_number, filing_year, form_type);

-- System alerts indexes
create index system_alerts_read_idx on public.system_alerts(read, created_at desc);
create index system_alerts_type_idx on public.system_alerts(alert_type);
create index system_alerts_expires_idx on public.system_alerts(expires_at) where expires_at is not null;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on clinics_pending_review
create trigger set_updated_at
  before update on public.clinics_pending_review
  for each row
  execute function public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
alter table public.clinics_pending_review enable row level security;
alter table public.usac_historical_filings enable row level security;
alter table public.system_alerts enable row level security;

-- Clinics pending review policies
create policy "Allow all operations for authenticated users"
  on public.clinics_pending_review
  for all
  using (true);

-- Historical filings policies
create policy "Allow read for all authenticated users"
  on public.usac_historical_filings
  for select
  using (true);

create policy "Allow insert for service role"
  on public.usac_historical_filings
  for insert
  with check (true);

-- System alerts policies
create policy "Allow all operations for authenticated users"
  on public.system_alerts
  for all
  using (true);

-- ============================================================================
-- HELPER VIEWS (Optional)
-- ============================================================================

-- View: High priority clinics not yet enriched
create or replace view public.high_priority_pending as
select
  id,
  hcp_number,
  clinic_name,
  city,
  state,
  priority_score,
  priority_label,
  filing_date,
  enriched,
  processed
from public.clinics_pending_review
where
  priority_label = 'High'
  and not processed
order by priority_score desc, filing_date desc;

-- View: Clinic summary statistics
create or replace view public.clinic_stats as
select
  count(*) as total_clinics,
  count(*) filter (where not processed) as pending_clinics,
  count(*) filter (where processed) as processed_clinics,
  count(*) filter (where enriched) as enriched_clinics,
  count(*) filter (where priority_label = 'High') as high_priority_count,
  count(*) filter (where priority_label = 'Medium') as medium_priority_count,
  count(*) filter (where priority_label = 'Low') as low_priority_count
from public.clinics_pending_review;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. After running this schema, generate TypeScript types with:
--    npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types.ts
--
-- 2. Update RLS policies if implementing multi-tenant user authentication
--
-- 3. Consider adding audit logging table for tracking changes to clinic records
--
-- 4. Monitor index usage and add/remove as needed based on query patterns
-- ============================================================================
