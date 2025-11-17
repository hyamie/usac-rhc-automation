-- ============================================================================
-- Migration: Add request_for_services column
-- Date: 2025-11-17
-- Description: Add request_for_services field to capture service type from Form 465
--              This field is needed for sorting/filtering in the webapp (Voice, Internet, etc.)
-- ============================================================================

-- Add the column to clinics_pending_review table
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS request_for_services text;

-- Add a helpful comment
COMMENT ON COLUMN public.clinics_pending_review.request_for_services IS
  'Type of service requested from Form 465 (e.g., Voice, Internet, Data Circuit, etc.)';

-- Create an index for filtering/sorting performance
CREATE INDEX IF NOT EXISTS idx_clinics_request_for_services
ON public.clinics_pending_review(request_for_services);

-- Update any existing records to have a default value if needed
-- (This is optional - you can remove if you want existing records to stay null)
UPDATE public.clinics_pending_review
SET request_for_services = 'Unknown'
WHERE request_for_services IS NULL
  AND processed = false;
