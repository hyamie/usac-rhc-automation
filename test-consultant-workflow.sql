-- ============================================================================
-- Test Consultant Workflow
-- Create a test clinic with consultant contact to verify template selection
-- ============================================================================

-- Insert test clinic with consultant contact
INSERT INTO clinics_pending_review (
  id,
  hcp_number,
  clinic_name,
  address,
  city,
  state,
  filing_date,
  form_465_hash,
  priority_score,
  priority_label,

  -- Contact info (consultant)
  contact_name,
  contact_title,
  contact_email,
  has_direct_contact,
  mail_contact_first_name,
  mail_contact_last_name,
  mail_contact_is_consultant,

  funding_year,
  created_at,
  updated_at
) VALUES (
  'test-consultant-clinic-001'::uuid,
  'HCP-TEST-001',
  'Test Rural Health Clinic',
  '123 Main Street',
  'Nashville',
  'TN',
  now(),
  'test-consultant-hash-001',
  75,
  'High',

  -- Consultant contact
  'Jane Smith',
  'RHC Consultant',
  'jane.smith@rhc-consulting.com',
  false,  -- NOT a direct contact
  'Jane',
  'Smith',
  true,   -- IS a consultant

  '2025',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
SET
  has_direct_contact = false,
  mail_contact_is_consultant = true,
  contact_name = 'Jane Smith',
  contact_email = 'jane.smith@rhc-consulting.com',
  mail_contact_first_name = 'Jane',
  mail_contact_last_name = 'Smith';

-- Verify clinic was created/updated
SELECT
  id,
  clinic_name,
  contact_name,
  contact_email,
  has_direct_contact,
  mail_contact_is_consultant,
  mail_contact_first_name,
  mail_contact_last_name
FROM clinics_pending_review
WHERE id = 'test-consultant-clinic-001'::uuid;

-- Verify consultant templates exist
SELECT
  id,
  version,
  template_variant,
  contact_type,
  tone,
  LEFT(subject_template, 60) as subject_preview,
  active
FROM email_templates
WHERE contact_type = 'consultant'
  AND active = true
  AND version = 'week-46-2025'
ORDER BY template_variant;

-- Expected results:
-- 1. Clinic record with has_direct_contact = false
-- 2. 3 active consultant templates (A, B, C)
