-- ============================================================================
-- Add Geocoding Fields to Clinics
-- ============================================================================
-- Description: Adds latitude/longitude fields for map visualization
-- Date: 2025-11-09
-- ============================================================================

-- Add latitude and longitude columns
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8),
ADD COLUMN IF NOT EXISTS zip text,
ADD COLUMN IF NOT EXISTS geocoded boolean default false,
ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

-- Add index for geocoding queries
CREATE INDEX IF NOT EXISTS idx_clinics_geocoded
ON public.clinics_pending_review(geocoded)
WHERE geocoded = false;

-- Add index for map queries
CREATE INDEX IF NOT EXISTS idx_clinics_coordinates
ON public.clinics_pending_review(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN public.clinics_pending_review.latitude IS 'Clinic latitude for map display';
COMMENT ON COLUMN public.clinics_pending_review.longitude IS 'Clinic longitude for map display';
COMMENT ON COLUMN public.clinics_pending_review.geocoded IS 'Whether address has been geocoded';
COMMENT ON COLUMN public.clinics_pending_review.geocoded_at IS 'When geocoding was performed';
