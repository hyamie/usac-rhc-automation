-- =============================================
-- USAC RHC Automation - Phase 2 Schema Updates
-- =============================================
-- Created: 2025-11-06
-- Purpose: Add consultant detection, historical funding, and additional fields
-- =============================================

-- Step 1: Add new columns to clinics_pending_review table
-- =============================================

-- Consultant detection fields
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS is_consultant boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consultant_company text,
ADD COLUMN IF NOT EXISTS consultant_email_domain text,
ADD COLUMN IF NOT EXISTS consultant_detection_method text
  CHECK (consultant_detection_method IN ('auto_domain', 'auto_employer', 'manual_tagged', 'manual_untagged'));

-- Historical funding fields (up to 3 years)
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS funding_year_1 integer,
ADD COLUMN IF NOT EXISTS funding_amount_1 numeric(12, 2),
ADD COLUMN IF NOT EXISTS funding_year_2 integer,
ADD COLUMN IF NOT EXISTS funding_amount_2 numeric(12, 2),
ADD COLUMN IF NOT EXISTS funding_year_3 integer,
ADD COLUMN IF NOT EXISTS funding_amount_3 numeric(12, 2);

-- Additional information fields
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS form_465_pdf_url text,
ADD COLUMN IF NOT EXISTS posting_date date,
ADD COLUMN IF NOT EXISTS allowable_contract_start_date date,
ADD COLUMN IF NOT EXISTS program_type text
  CHECK (program_type IN ('Telecom', 'Healthcare Connect')),
ADD COLUMN IF NOT EXISTS mail_contact_name text,
ADD COLUMN IF NOT EXISTS mail_contact_email text,
ADD COLUMN IF NOT EXISTS mail_contact_company text,
ADD COLUMN IF NOT EXISTS description_of_services text;

-- Step 2: Create consultant email domains tracking table
-- =============================================

CREATE TABLE IF NOT EXISTS public.consultant_email_domains (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  domain text UNIQUE NOT NULL,
  associated_company text,
  added_date timestamptz DEFAULT now(),
  added_by text DEFAULT 'manual_tag',
  notes text,
  is_active boolean DEFAULT true
);

-- Create index for faster domain lookups
CREATE INDEX IF NOT EXISTS idx_consultant_domains_domain
  ON public.consultant_email_domains(domain)
  WHERE is_active = true;

-- Step 3: Add comments for documentation
-- =============================================

COMMENT ON COLUMN public.clinics_pending_review.is_consultant IS
  'Flag indicating if contact is a consultant (TRUE) or direct facility contact (FALSE)';

COMMENT ON COLUMN public.clinics_pending_review.consultant_company IS
  'Name of consulting company if is_consultant = TRUE';

COMMENT ON COLUMN public.clinics_pending_review.consultant_email_domain IS
  'Email domain of consultant if different from facility domain';

COMMENT ON COLUMN public.clinics_pending_review.consultant_detection_method IS
  'Method used to identify consultant: auto_domain (email domain mismatch), auto_employer (employer name match), manual_tagged (user tagged), manual_untagged (user untagged)';

COMMENT ON COLUMN public.clinics_pending_review.program_type IS
  'USAC program type: Telecom or Healthcare Connect';

COMMENT ON COLUMN public.clinics_pending_review.mail_contact_name IS
  'Mailing contact name (may differ from primary contact if using consultant)';

COMMENT ON COLUMN public.clinics_pending_review.mail_contact_email IS
  'Mailing contact email (may differ from primary contact if using consultant)';

COMMENT ON COLUMN public.clinics_pending_review.mail_contact_company IS
  'Mailing contact company name (often consultant company name)';

COMMENT ON TABLE public.consultant_email_domains IS
  'Tracks email domains associated with telecom consultants for automated detection';

-- Step 4: Create helper function for consultant detection
-- =============================================

CREATE OR REPLACE FUNCTION public.detect_consultant_by_domain(
  contact_email text,
  mail_email text
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  contact_domain text;
  mail_domain text;
BEGIN
  -- Extract domains from email addresses
  contact_domain := split_part(contact_email, '@', 2);
  mail_domain := split_part(mail_email, '@', 2);

  -- Return TRUE if domains differ (indicating consultant)
  RETURN (contact_domain IS DISTINCT FROM mail_domain) AND mail_domain IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION public.detect_consultant_by_domain IS
  'Helper function to detect if a contact is a consultant based on email domain mismatch';

-- Step 5: Create view for consultant analytics
-- =============================================

CREATE OR REPLACE VIEW public.consultant_analytics AS
SELECT
  COUNT(*) FILTER (WHERE is_consultant = true) as total_consultants,
  COUNT(*) FILTER (WHERE is_consultant = false) as total_direct,
  COUNT(DISTINCT consultant_company) FILTER (WHERE is_consultant = true) as unique_consultant_companies,
  COUNT(DISTINCT consultant_email_domain) FILTER (WHERE is_consultant = true) as unique_consultant_domains,
  COUNT(*) FILTER (WHERE consultant_detection_method = 'auto_domain') as auto_detected,
  COUNT(*) FILTER (WHERE consultant_detection_method = 'manual_tagged') as manually_tagged
FROM public.clinics_pending_review;

COMMENT ON VIEW public.consultant_analytics IS
  'Summary analytics for consultant vs direct contacts';

-- Step 6: Grant necessary permissions (adjust role as needed)
-- =============================================

-- Grant permissions on new table
GRANT SELECT, INSERT, UPDATE ON public.consultant_email_domains TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.consultant_email_domains TO anon;

-- Grant permissions on updated table
GRANT SELECT, INSERT, UPDATE ON public.clinics_pending_review TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clinics_pending_review TO anon;

-- Grant permissions on view
GRANT SELECT ON public.consultant_analytics TO authenticated;
GRANT SELECT ON public.consultant_analytics TO anon;

-- =============================================
-- Migration Complete
-- =============================================
--
-- Next Steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Update n8n workflows to populate new fields
-- 3. Update dashboard to display new data
-- 4. Test consultant detection logic
--
-- Rollback (if needed):
-- ALTER TABLE public.clinics_pending_review DROP COLUMN IF EXISTS is_consultant CASCADE;
-- DROP TABLE IF EXISTS public.consultant_email_domains CASCADE;
-- DROP VIEW IF EXISTS public.consultant_analytics CASCADE;
-- DROP FUNCTION IF EXISTS public.detect_consultant_by_domain CASCADE;
-- =============================================
