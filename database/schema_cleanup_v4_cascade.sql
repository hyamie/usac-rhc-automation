-- ============================================================================
-- SCHEMA CLEANUP V4 (CASCADE): Add USAC Fields + Remove Bloat
-- ============================================================================
-- Date: November 9, 2025
-- Fix: Use CASCADE to automatically drop all dependent views
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

-- STEP 2: Remove Priority/Enrichment Bloat (with CASCADE)
-- ============================================================================
-- CASCADE will automatically drop any views/functions that depend on these columns

ALTER TABLE public.clinics_pending_review
DROP COLUMN IF EXISTS priority_score CASCADE,
DROP COLUMN IF EXISTS priority_label CASCADE,
DROP COLUMN IF EXISTS total_funding_3y CASCADE,
DROP COLUMN IF EXISTS location_count CASCADE,
DROP COLUMN IF EXISTS participation_years CASCADE,
DROP COLUMN IF EXISTS enriched CASCADE,
DROP COLUMN IF EXISTS contact_title CASCADE,
DROP COLUMN IF EXISTS clinic_website CASCADE,
DROP COLUMN IF EXISTS linkedin_url CASCADE,
DROP COLUMN IF EXISTS enrichment_date CASCADE;

-- STEP 3: Add Column Comments
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
-- MIGRATION COMPLETE
-- ============================================================================
-- Note: CASCADE removed any dependent views (high_priority_pending, clinic_stats, etc.)
-- These views were based on the old priority scoring system and are no longer needed
-- ============================================================================
