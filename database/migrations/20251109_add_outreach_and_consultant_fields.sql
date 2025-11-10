-- ============================================================================
-- Migration: Add Outreach Status and Consultant Tagging Fields
-- ============================================================================
-- Date: 2025-11-09
-- Description: Adds fields to support outreach workflow tracking and
--              consultant contact tagging for the dashboard
-- ============================================================================

-- Add outreach_status field to track clinic through outreach pipeline
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS outreach_status text
  DEFAULT 'pending'
  CHECK (outreach_status IN ('pending', 'ready_for_outreach', 'outreach_sent', 'follow_up', 'completed'));

-- Add consultant tagging for mail contact
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS mail_contact_is_consultant boolean
  DEFAULT false
  NOT NULL;

-- Add consultant tagging for primary contact
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS contact_is_consultant boolean
  DEFAULT false
  NOT NULL;

-- Create index for outreach_status filtering
CREATE INDEX IF NOT EXISTS clinics_outreach_status_idx
  ON public.clinics_pending_review(outreach_status)
  WHERE NOT processed;

-- Create index for consultant filtering
CREATE INDEX IF NOT EXISTS clinics_consultant_contacts_idx
  ON public.clinics_pending_review(mail_contact_is_consultant, contact_is_consultant)
  WHERE NOT processed;

-- Add comment for documentation
COMMENT ON COLUMN public.clinics_pending_review.outreach_status IS
  'Tracks the clinic through the outreach workflow pipeline: pending -> ready_for_outreach -> outreach_sent -> follow_up -> completed';

COMMENT ON COLUMN public.clinics_pending_review.mail_contact_is_consultant IS
  'Indicates if the mail contact person is identified as a consultant (affects outreach routing)';

COMMENT ON COLUMN public.clinics_pending_review.contact_is_consultant IS
  'Indicates if the primary contact is identified as a consultant (affects outreach routing)';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. The outreach_status field provides granular tracking through the workflow
--    stages beyond the simple processed boolean
-- 2. Two separate consultant flags allow tagging both primary and mail contacts
--    independently since they may have different roles
-- 3. Indexes are added for filtering performance in the dashboard
-- 4. Default values ensure backward compatibility with existing records
-- ============================================================================
