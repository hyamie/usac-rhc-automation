-- =============================================
-- USAC RHC Automation - Schema Alignment Fix
-- =============================================
-- Version: 3.0
-- Date: 2025-11-09
-- Purpose: Add missing columns to match n8n workflow
-- Dependencies: schema.sql, schema_update_v2.sql must be applied first
-- =============================================

-- Step 1: Add missing core fields from n8n workflow
-- These fields are extracted from USAC API but were missing from database
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS application_number text,
ADD COLUMN IF NOT EXISTS zip text,
ADD COLUMN IF NOT EXISTS contact_phone text;

-- Step 2: Add document storage (JSONB for flexible array storage)
-- USAC provides RFP 1-10 and Additional Document 1-10 (20 separate fields)
-- Store as structured JSONB for better queryability
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS additional_documents jsonb
  DEFAULT '{"rfp_links": [], "additional_docs": []}'::jsonb;

-- Step 3: Add indexes for new searchable fields
CREATE INDEX IF NOT EXISTS idx_clinics_application_number
  ON public.clinics_pending_review(application_number);

CREATE INDEX IF NOT EXISTS idx_clinics_zip
  ON public.clinics_pending_review(zip);

-- Step 4: Add GIN index for JSONB document search
CREATE INDEX IF NOT EXISTS idx_clinics_additional_documents
  ON public.clinics_pending_review USING gin(additional_documents);

-- Step 5: Add comments for documentation
COMMENT ON COLUMN public.clinics_pending_review.application_number IS
  'Form 465 Application Number from USAC (e.g., RHC46500001741). Used to construct PDF URL.';

COMMENT ON COLUMN public.clinics_pending_review.zip IS
  'ZIP code of service delivery site from site_zip_code field';

COMMENT ON COLUMN public.clinics_pending_review.contact_phone IS
  'Primary contact phone number from contact_phone_number field';

COMMENT ON COLUMN public.clinics_pending_review.additional_documents IS
  'JSONB object containing arrays of document links:
  {
    "rfp_links": ["url1", "url2", ...],     # RFP documents 1-10
    "additional_docs": ["url1", "url2", ...]  # Additional documents 1-10
  }';

-- Step 6: Create helper function to extract document count
CREATE OR REPLACE FUNCTION public.get_document_count(docs jsonb)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    (jsonb_array_length(docs->'rfp_links') +
     jsonb_array_length(docs->'additional_docs'))::integer;
$$;

COMMENT ON FUNCTION public.get_document_count IS
  'Helper function to count total documents in additional_documents JSONB field';

-- Step 7: Create view for records with documents
CREATE OR REPLACE VIEW public.clinics_with_documents AS
SELECT
  id,
  hcp_number,
  clinic_name,
  application_number,
  state,
  get_document_count(additional_documents) as total_documents,
  jsonb_array_length(additional_documents->'rfp_links') as rfp_count,
  jsonb_array_length(additional_documents->'additional_docs') as additional_doc_count,
  additional_documents,
  created_at
FROM public.clinics_pending_review
WHERE additional_documents IS NOT NULL
  AND (
    jsonb_array_length(additional_documents->'rfp_links') > 0 OR
    jsonb_array_length(additional_documents->'additional_docs') > 0
  )
ORDER BY created_at DESC;

COMMENT ON VIEW public.clinics_with_documents IS
  'View of clinics that have uploaded RFP or additional documents';

-- Step 8: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.clinics_pending_review TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.clinics_pending_review TO anon;
GRANT SELECT ON public.clinics_with_documents TO authenticated;
GRANT SELECT ON public.clinics_with_documents TO anon;

-- =============================================
-- Validation Queries
-- =============================================

-- Check if columns were added successfully
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics_pending_review'
    AND column_name = 'application_number'
  ) THEN
    RAISE EXCEPTION 'Migration failed: application_number column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics_pending_review'
    AND column_name = 'zip'
  ) THEN
    RAISE EXCEPTION 'Migration failed: zip column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics_pending_review'
    AND column_name = 'contact_phone'
  ) THEN
    RAISE EXCEPTION 'Migration failed: contact_phone column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinics_pending_review'
    AND column_name = 'additional_documents'
  ) THEN
    RAISE EXCEPTION 'Migration failed: additional_documents column not created';
  END IF;

  RAISE NOTICE 'Migration successful: All columns created';
END $$;

-- Show current schema (for verification)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clinics_pending_review'
  AND column_name IN ('application_number', 'zip', 'contact_phone', 'additional_documents')
ORDER BY column_name;

-- =============================================
-- Migration Complete
-- =============================================
-- Next Steps:
-- 1. Reload Supabase schema cache (Settings → API → Reload Schema)
-- 2. Update n8n workflow to populate new fields
-- 3. Test workflow with pinned data
-- 4. Verify data inserts successfully
--
-- Rollback (if needed):
-- ALTER TABLE public.clinics_pending_review
--   DROP COLUMN IF EXISTS application_number,
--   DROP COLUMN IF EXISTS zip,
--   DROP COLUMN IF EXISTS contact_phone,
--   DROP COLUMN IF EXISTS additional_documents;
-- DROP VIEW IF EXISTS public.clinics_with_documents;
-- DROP FUNCTION IF EXISTS public.get_document_count;
-- =============================================
