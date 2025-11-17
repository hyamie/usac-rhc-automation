-- ============================================================================
-- COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- URL: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql
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
UPDATE public.clinics_pending_review
SET request_for_services = 'Unknown'
WHERE request_for_services IS NULL
  AND processed = false;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clinics_pending_review'
  AND column_name = 'request_for_services';
