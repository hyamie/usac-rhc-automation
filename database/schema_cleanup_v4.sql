-- ============================================================================
-- SCHEMA CLEANUP V4: Add USAC Fields + Remove Bloat
-- ============================================================================
-- Date: November 9, 2025
-- Purpose: Align schema with actual USAC API data structure
-- Philosophy: Store exactly what USAC provides, nothing more
-- ============================================================================

-- STEP 1: Add Missing USAC Fields
-- ============================================================================

ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS funding_year text,
ADD COLUMN IF NOT EXISTS application_type text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS allowable_contract_start_date timestamptz,
ADD COLUMN IF NOT EXISTS form_465_pdf_url text,
ADD COLUMN IF NOT EXISTS mail_contact_first_name text,
ADD COLUMN IF NOT EXISTS mail_contact_last_name text,
ADD COLUMN IF NOT EXISTS mail_contact_org_name text,
ADD COLUMN IF NOT EXISTS mail_contact_phone text,
ADD COLUMN IF NOT EXISTS mail_contact_email text,
ADD COLUMN IF NOT EXISTS historical_funding jsonb DEFAULT '[]'::jsonb;

-- ============================================================================
-- STEP 2: Remove Priority/Enrichment Bloat
-- ============================================================================
-- These fields were premature optimization and add unnecessary complexity
-- Decision: Remove all priority scoring and enrichment fields

ALTER TABLE public.clinics_pending_review
DROP COLUMN IF EXISTS priority_score,
DROP COLUMN IF EXISTS priority_label,
DROP COLUMN IF EXISTS total_funding_3y,
DROP COLUMN IF EXISTS location_count,
DROP COLUMN IF EXISTS participation_years,
DROP COLUMN IF EXISTS enriched,
DROP COLUMN IF EXISTS contact_title,
DROP COLUMN IF EXISTS clinic_website,
DROP COLUMN IF EXISTS linkedin_url,
DROP COLUMN IF EXISTS enrichment_date;

-- ============================================================================
-- STEP 3: Verify Final Schema
-- ============================================================================

COMMENT ON COLUMN public.clinics_pending_review.funding_year IS 'Funding year from USAC Form 465 filing (e.g., "2026")';
COMMENT ON COLUMN public.clinics_pending_review.application_type IS 'Type of application (e.g., "New", "Renewal")';
COMMENT ON COLUMN public.clinics_pending_review.contact_email IS 'Primary contact email address';
COMMENT ON COLUMN public.clinics_pending_review.allowable_contract_start_date IS 'Earliest allowable contract start date from Form 465';
COMMENT ON COLUMN public.clinics_pending_review.form_465_pdf_url IS 'Direct link to Form 465 PDF on USAC website';
COMMENT ON COLUMN public.clinics_pending_review.mail_contact_first_name IS 'Mailing contact first name';
COMMENT ON COLUMN public.clinics_pending_review.mail_contact_last_name IS 'Mailing contact last name';
COMMENT ON COLUMN public.clinics_pending_review.mail_contact_org_name IS 'Mailing contact organization name';
COMMENT ON COLUMN public.clinics_pending_review.mail_contact_phone IS 'Mailing contact phone number';
COMMENT ON COLUMN public.clinics_pending_review.mail_contact_email IS 'Mailing contact email address';
COMMENT ON COLUMN public.clinics_pending_review.historical_funding IS 'JSONB array of historical funding amounts: [{"year": "2023", "amount": 50000}]';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after migration to confirm schema is correct:

-- SELECT
--   column_name,
--   data_type,
--   is_nullable,
--   column_default
-- FROM information_schema.columns
-- WHERE table_name = 'clinics_pending_review'
-- ORDER BY ordinal_position;

-- ============================================================================
-- EXPECTED FINAL SCHEMA (Core Fields)
-- ============================================================================
/*
USAC Data Fields (from Form 465 API):
  - hcp_number (text) - Healthcare Provider number
  - clinic_name (text) - Provider name
  - application_number (text) - Unique application identifier
  - funding_year (text) - Funding year (NEW)
  - application_type (text) - Application type (NEW)
  - address, city, state, zip (text) - Location
  - contact_name (text) - Primary contact full name
  - contact_phone (text) - Primary contact phone
  - contact_email (text) - Primary contact email (NEW)
  - mail_contact_first_name (text) - Mailing contact (NEW)
  - mail_contact_last_name (text) - Mailing contact (NEW)
  - mail_contact_org_name (text) - Mailing org (NEW)
  - mail_contact_phone (text) - Mailing phone (NEW)
  - mail_contact_email (text) - Mailing email (NEW)
  - allowable_contract_start_date (timestamptz) - Start date (NEW)
  - contract_length (integer) - Contract period in months
  - service_type (text) - Services requested description
  - form_465_pdf_url (text) - Link to PDF (NEW)
  - additional_documents (jsonb) - RFP links and other docs
  - form_465_hash (text) - Deduplication hash
  - filing_date (timestamptz) - When Form 465 was filed

Historical Data Fields (from Funding API):
  - historical_funding (jsonb) - Array of {year, amount} objects (NEW)

Internal Tracking Fields (kept per user request):
  - processed (boolean) - Marked as reviewed
  - assigned_to (text) - Who's working on it
  - notes (text) - User notes
  - email_draft_created (boolean) - Email drafted

System Fields:
  - id (uuid, primary key)
  - created_at (timestamptz)
  - updated_at (timestamptz)
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
