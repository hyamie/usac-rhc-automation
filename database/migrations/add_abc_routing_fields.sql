-- ============================================================================
-- Migration: Add ABC Routing Fields
-- ============================================================================
-- Description: Adds fields to support multi-dimensional email routing based on
--              requested service type, funding thresholds, and consultant status
-- Date: 2025-11-14
-- ============================================================================

-- Add new columns to clinics_pending_review table
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS requested_service_category TEXT CHECK (
  requested_service_category IN (
    'voice',
    'data',
    'both_telecom_internet',
    'telecommunications_only',
    'other',
    'unknown'
  )
),
ADD COLUMN IF NOT EXISTS funding_threshold TEXT CHECK (
  funding_threshold IN ('high', 'medium', 'low', 'unknown')
),
ADD COLUMN IF NOT EXISTS total_3yr_funding NUMERIC(12, 2),
ADD COLUMN IF NOT EXISTS abc_route_assignment TEXT CHECK (
  abc_route_assignment IN ('route_a', 'route_b', 'route_c', 'unassigned')
),
ADD COLUMN IF NOT EXISTS route_reasoning TEXT;

-- Add helpful comments
COMMENT ON COLUMN public.clinics_pending_review.requested_service_category IS
  'Parsed service category from service_type field: voice, data, both_telecom_internet, telecommunications_only, other, unknown';

COMMENT ON COLUMN public.clinics_pending_review.funding_threshold IS
  'Funding threshold based on 3-year historical funding: high (>$100k), medium ($25k-$100k), low (<$25k), unknown (no history)';

COMMENT ON COLUMN public.clinics_pending_review.total_3yr_funding IS
  'Sum of funding_amount_1 + funding_amount_2 + funding_amount_3 from historical data';

COMMENT ON COLUMN public.clinics_pending_review.abc_route_assignment IS
  'Email template route assignment: route_a (premium), route_b (standard), route_c (light-touch), unassigned';

COMMENT ON COLUMN public.clinics_pending_review.route_reasoning IS
  'Human-readable explanation of why this route was assigned';

-- Create index for filtering by route assignment
CREATE INDEX IF NOT EXISTS clinics_abc_route_idx
  ON public.clinics_pending_review(abc_route_assignment);

-- Create composite index for common filtering patterns
CREATE INDEX IF NOT EXISTS clinics_service_funding_idx
  ON public.clinics_pending_review(requested_service_category, funding_threshold);

-- ============================================================================
-- Backfill Logic (Optional - for existing records)
-- ============================================================================

-- Set default route_assignment for existing records to 'unassigned'
UPDATE public.clinics_pending_review
SET
  abc_route_assignment = 'unassigned',
  requested_service_category = 'unknown',
  funding_threshold = 'unknown'
WHERE abc_route_assignment IS NULL;

-- Attempt to parse existing service_type data into categories
UPDATE public.clinics_pending_review
SET requested_service_category =
  CASE
    WHEN service_type ILIKE '%voice%' THEN 'voice'
    WHEN service_type ILIKE '%data%' THEN 'data'
    WHEN service_type ILIKE '%both%' OR service_type ILIKE '%telecommunications%internet%' THEN 'both_telecom_internet'
    WHEN service_type ILIKE '%telecommunications%only%' THEN 'telecommunications_only'
    WHEN service_type ILIKE '%other%' THEN 'other'
    ELSE 'unknown'
  END
WHERE service_type IS NOT NULL
  AND requested_service_category = 'unknown';

-- Calculate total 3-year funding for existing records
UPDATE public.clinics_pending_review
SET total_3yr_funding = COALESCE(funding_amount_1, 0) +
                        COALESCE(funding_amount_2, 0) +
                        COALESCE(funding_amount_3, 0)
WHERE total_3yr_funding IS NULL;

-- Assign funding thresholds based on total_3yr_funding
UPDATE public.clinics_pending_review
SET funding_threshold =
  CASE
    WHEN total_3yr_funding > 100000 THEN 'high'
    WHEN total_3yr_funding >= 25000 THEN 'medium'
    WHEN total_3yr_funding > 0 THEN 'low'
    ELSE 'unknown'
  END
WHERE funding_threshold = 'unknown'
  AND total_3yr_funding IS NOT NULL;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check distribution of service categories
-- SELECT requested_service_category, COUNT(*) as count
-- FROM public.clinics_pending_review
-- GROUP BY requested_service_category
-- ORDER BY count DESC;

-- Check distribution of funding thresholds
-- SELECT funding_threshold, COUNT(*) as count
-- FROM public.clinics_pending_review
-- GROUP BY funding_threshold
-- ORDER BY count DESC;

-- Check distribution of route assignments
-- SELECT abc_route_assignment, COUNT(*) as count
-- FROM public.clinics_pending_review
-- GROUP BY abc_route_assignment
-- ORDER BY count DESC;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. Run this migration in Supabase SQL Editor
-- 2. After migration, regenerate TypeScript types:
--    npx supabase gen types typescript --project-id fhuqiicgmfpnmficopqp > dashboard/src/types/database.types.ts
-- 3. Update n8n workflow to populate these fields
-- 4. Test with sample data before production deployment
-- ============================================================================
