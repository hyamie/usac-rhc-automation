-- ============================================================================
-- Clinic Groups Migration
-- Allows manual grouping of multiple clinics/HCP numbers into one entity
-- ============================================================================

-- ============================================================================
-- Clinic Groups
-- Stores manual groupings of clinics under a common name
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clinic_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Group metadata
  group_name TEXT NOT NULL,
  primary_clinic_id UUID REFERENCES public.clinics_pending_review(id) ON DELETE SET NULL,

  -- Aggregated data (computed at creation, updated as needed)
  total_funding_amount NUMERIC(12,2),
  location_count INTEGER,

  -- User tracking
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Clinic Group Members
-- Junction table for many-to-many relationship between groups and clinics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clinic_group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  group_id UUID NOT NULL REFERENCES public.clinic_groups(id) ON DELETE CASCADE,
  clinic_id UUID NOT NULL REFERENCES public.clinics_pending_review(id) ON DELETE CASCADE,

  added_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure each clinic can only be in a group once
  UNIQUE(group_id, clinic_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS clinic_group_members_group_idx ON public.clinic_group_members(group_id);
CREATE INDEX IF NOT EXISTS clinic_group_members_clinic_idx ON public.clinic_group_members(clinic_id);
CREATE INDEX IF NOT EXISTS clinic_groups_created_idx ON public.clinic_groups(created_at DESC);

-- ============================================================================
-- Add belongs_to_group_id to clinics_pending_review
-- ============================================================================
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS belongs_to_group_id UUID REFERENCES public.clinic_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clinics_group_idx ON public.clinics_pending_review(belongs_to_group_id) WHERE belongs_to_group_id IS NOT NULL;

-- ============================================================================
-- Auto-update updated_at trigger
-- ============================================================================
CREATE TRIGGER set_clinic_groups_updated_at
  BEFORE UPDATE ON public.clinic_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.clinic_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_group_members ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
  ON public.clinic_groups
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations for authenticated users"
  ON public.clinic_group_members
  FOR ALL
  USING (true);
