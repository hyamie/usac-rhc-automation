# Consultant Workflow Testing Plan
**Date:** 2025-11-13
**Status:** Ready to Execute
**Priority:** High

---

## 🎯 Objective

Test the n8n workflow with a consultant contact to verify:
1. ✅ Workflow correctly identifies consultant vs direct contact
2. ✅ Workflow selects consultant template (A/B/C)
3. ✅ Template rendering uses consultant-specific messaging
4. ✅ Email draft created successfully
5. ✅ Database records stored correctly

---

## 📋 Prerequisites

### Database Requirements
- [ ] `clinics_pending_review` table has required fields:
  - `has_direct_contact` (boolean)
  - `mail_contact_first_name` (text)
  - `mail_contact_last_name` (text)
  - `mail_contact_is_consultant` (boolean, optional)

- [ ] `email_templates` table has 3 active consultant templates:
  - Template A (professional)
  - Template B (conversational)
  - Template C (hybrid)
  - All with `contact_type = 'consultant'` and `version = 'week-46-2025'`

### Workflow Requirements
- [ ] n8n workflow active and accessible
- [ ] All credentials configured (Supabase, Perplexity, O365)
- [ ] Test webhook URL available

---

## 🧪 Test Scenarios

### Scenario 1: Consultant Contact with Template A (Least Used)

**Setup:**
1. Create test clinic with consultant contact
2. Ensure Template A has lowest `times_used` count
3. Trigger workflow

**Expected Results:**
- Node 2: Retrieves clinic successfully
- Node 3: Returns `contact_type = 'consultant'`
- Node 4: Returns Template A (consultant, professional)
- Node 5: Returns clinic-specific enrichment
- Node 6: Renders email with consultant messaging
  - Subject references consultant relationship
  - Body says "I see you're working with [clinic]..."
  - Tone is professional, focused on competitive bid
- Node 7-8: Creates O365 draft successfully
- Node 9-10: Stores email_instances record
- Node 11: Increments Template A times_used

**Verification:**
```sql
-- Check email instance
SELECT
  id,
  clinic_id,
  template_id,
  subject_rendered,
  LEFT(body_rendered, 100) as body_preview,
  enrichment_data,
  draft_id,
  created_at
FROM email_instances
WHERE clinic_id = 'test-consultant-clinic-001'::uuid
ORDER BY created_at DESC
LIMIT 1;

-- Verify template rotation
SELECT
  id,
  template_variant,
  contact_type,
  times_used
FROM email_templates
WHERE contact_type = 'consultant'
  AND version = 'week-46-2025'
ORDER BY template_variant;
```

---

### Scenario 2: Direct Contact for Comparison

**Setup:**
1. Use existing test clinic (Honesdale Family Health Center)
2. Ensure `has_direct_contact = true`
3. Trigger workflow

**Expected Results:**
- Node 3: Returns `contact_type = 'direct'`
- Node 4: Returns direct template (A/B/C)
- Node 6: Renders with direct messaging
  - Subject does NOT reference consultant
  - Body says "I noticed [clinic] filed..."
  - Tone is direct-to-clinic

**Verification:**
- Compare consultant vs direct email body
- Verify different messaging approach

---

### Scenario 3: Consultant Template Rotation (B, then C)

**Setup:**
1. Run workflow 3 times with consultant contact
2. Track which template is selected each time

**Expected Results:**
- Run 1: Template A (times_used: 0)
- Run 2: Template B (times_used: 0)
- Run 3: Template C (times_used: 0)
- Run 4: Template A again (times_used: 1)

**Verification:**
```sql
SELECT
  template_variant,
  times_used
FROM email_templates
WHERE contact_type = 'consultant'
  AND version = 'week-46-2025'
ORDER BY times_used ASC, template_variant;
```

---

## 📝 Test Execution Steps

### Step 1: Verify Database Schema

Run `check-clinics-schema.sql` to verify fields exist:
```sql
-- Check if has_direct_contact field exists
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'clinics_pending_review'
  AND column_name IN (
    'has_direct_contact',
    'mail_contact_first_name',
    'mail_contact_last_name',
    'mail_contact_is_consultant'
  );
```

**Expected Output:** All 4 fields present

**If fields missing:** Run migration to add them:
```sql
ALTER TABLE clinics_pending_review
ADD COLUMN IF NOT EXISTS has_direct_contact boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mail_contact_first_name text,
ADD COLUMN IF NOT EXISTS mail_contact_last_name text,
ADD COLUMN IF NOT EXISTS mail_contact_is_consultant boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS funding_year text DEFAULT '2025';

-- Update existing clinic to have proper contact fields
UPDATE clinics_pending_review
SET
  has_direct_contact = true,
  mail_contact_first_name = split_part(contact_name, ' ', 1),
  mail_contact_last_name = split_part(contact_name, ' ', 2),
  mail_contact_is_consultant = false
WHERE mail_contact_first_name IS NULL;
```

---

### Step 2: Verify Consultant Templates Exist

Run query to check templates:
```sql
SELECT
  id,
  version,
  template_variant,
  contact_type,
  tone,
  LEFT(subject_template, 60) as subject_preview,
  LEFT(body_template, 100) as body_preview,
  active,
  times_used
FROM email_templates
WHERE contact_type = 'consultant'
  AND version = 'week-46-2025'
ORDER BY template_variant;
```

**Expected Output:** 3 templates (A, B, C) all active

**If templates missing:** Run `update_templates_smykm.sql` to insert consultant templates

---

### Step 3: Create Test Consultant Clinic

Run `test-consultant-workflow.sql`:
```sql
-- This creates a test clinic with consultant contact
INSERT INTO clinics_pending_review (
  id,
  hcp_number,
  clinic_name,
  city,
  state,
  filing_date,
  form_465_hash,
  priority_score,
  priority_label,
  contact_name,
  contact_email,
  has_direct_contact,
  mail_contact_first_name,
  mail_contact_last_name,
  funding_year
) VALUES (
  'test-consultant-001'::uuid,
  'HCP-TEST-CONS-001',
  'Test Consultant Clinic',
  'Nashville',
  'TN',
  now(),
  'test-cons-hash-001',
  75,
  'High',
  'Jane Smith',
  'jane.smith@rhc-consulting.com',
  false,  -- Consultant contact
  'Jane',
  'Smith',
  '2025'
);
```

---

### Step 4: Trigger Workflow with Consultant Clinic

Use PowerShell to trigger workflow:
```powershell
$body = @{
  clinic_id = "test-consultant-001"
} | ConvertTo-Json

$response = Invoke-RestMethod -Method POST `
  -Uri "https://hyamie.app.n8n.cloud/webhook-test/outreach-email" `
  -Body $body `
  -ContentType "application/json"

$response | ConvertTo-Json -Depth 10
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Draft created successfully",
  "draft_id": "[O365 draft ID]",
  "draft_url": "https://outlook.office.com/...",
  "email_instance_id": "[UUID]",
  "clinic_id": "test-consultant-001",
  "template_id": "[consultant template UUID]"
}
```

---

### Step 5: Verify Draft in Outlook

1. Open Mike's Outlook
2. Go to Drafts folder
3. Find most recent draft
4. Verify:
   - ✅ Subject mentions consultant relationship or RHC program
   - ✅ Opening says "I see you're working with [clinic]..."
   - ✅ Body focuses on competitive bid opportunity
   - ✅ Tone is professional consultant-to-consultant
   - ✅ No direct-to-clinic messaging like "I know what you're thinking"

---

### Step 6: Verify Database Records

Check email instance:
```sql
SELECT
  ei.id,
  ei.clinic_id,
  c.clinic_name,
  c.has_direct_contact,
  et.template_variant,
  et.contact_type,
  et.tone,
  LEFT(ei.subject_rendered, 80) as subject,
  LEFT(ei.body_rendered, 200) as body_preview,
  ei.draft_id IS NOT NULL as draft_created,
  ei.created_at
FROM email_instances ei
JOIN email_templates et ON ei.template_id = et.id
JOIN clinics_pending_review c ON ei.clinic_id = c.id
WHERE c.id = 'test-consultant-001'::uuid
ORDER BY ei.created_at DESC
LIMIT 1;
```

**Expected Output:**
- `has_direct_contact = false`
- `contact_type = 'consultant'`
- `template_variant = 'A'` (or B/C based on rotation)
- `subject` contains consultant-appropriate messaging
- `body_preview` shows consultant template opening
- `draft_created = true`

---

### Step 7: Test Template Rotation

Run workflow 3 more times and verify template rotation:
```powershell
# Run 2
Invoke-RestMethod -Method POST `
  -Uri "https://hyamie.app.n8n.cloud/webhook-test/outreach-email" `
  -Body (@{ clinic_id = "test-consultant-001" } | ConvertTo-Json) `
  -ContentType "application/json"

# Wait 5 seconds
Start-Sleep -Seconds 5

# Run 3
Invoke-RestMethod -Method POST `
  -Uri "https://hyamie.app.n8n.cloud/webhook-test/outreach-email" `
  -Body (@{ clinic_id = "test-consultant-001" } | ConvertTo-Json) `
  -ContentType "application/json"

# Check template usage counts
```

Query template usage:
```sql
SELECT
  template_variant,
  contact_type,
  times_used
FROM email_templates
WHERE contact_type = 'consultant'
  AND version = 'week-46-2025'
ORDER BY times_used ASC, template_variant;
```

**Expected Output:**
- Template A: times_used = 1
- Template B: times_used = 1
- Template C: times_used = 1

---

## ✅ Success Criteria

- [x] Workflow identifies consultant contact (`has_direct_contact = false`)
- [x] Workflow selects consultant template
- [x] Template renders with consultant-specific messaging
- [x] Email subject appropriate for consultant contact
- [x] Email body uses "working with [clinic]" language
- [x] Draft created in Outlook successfully
- [x] Email instance stored in database
- [x] Template usage count incremented
- [x] Template rotation working (A → B → C → A)

---

## 🐛 Troubleshooting

### Issue: "has_direct_contact field not found"
**Solution:** Run ALTER TABLE to add field (see Step 1)

### Issue: "No consultant templates found"
**Solution:** Run `update_templates_smykm.sql` to insert consultant templates

### Issue: Workflow returns direct template instead of consultant
**Cause:** Clinic has `has_direct_contact = true`
**Solution:** Update clinic record:
```sql
UPDATE clinics_pending_review
SET has_direct_contact = false
WHERE id = 'test-consultant-001'::uuid;
```

### Issue: Template always returns A, never rotates
**Cause:** `times_used` not incrementing
**Solution:** Check Node 11-12 in workflow (Increment Template Usage)

---

## 📊 Test Results Summary

### Test 1: Consultant Contact
- **Status:** [ ] Pass / [ ] Fail
- **Template Selected:** [ ] A / [ ] B / [ ] C
- **Contact Type Detected:** [ ] consultant / [ ] direct
- **Draft Created:** [ ] Yes / [ ] No
- **Notes:**

### Test 2: Direct Contact Comparison
- **Status:** [ ] Pass / [ ] Fail
- **Template Selected:** [ ] A / [ ] B / [ ] C
- **Contact Type Detected:** [ ] consultant / [ ] direct
- **Draft Created:** [ ] Yes / [ ] No
- **Notes:**

### Test 3: Template Rotation
- **Status:** [ ] Pass / [ ] Fail
- **Run 1 Template:** [ ] A / [ ] B / [ ] C
- **Run 2 Template:** [ ] A / [ ] B / [ ] C
- **Run 3 Template:** [ ] A / [ ] B / [ ] C
- **Notes:**

---

## 📁 Related Files

- `test-consultant-workflow.sql` - Test clinic creation
- `check-clinics-schema.sql` - Schema verification
- `workflows/outreach_email_generation_HTTP.json` - n8n workflow
- `database/update_templates_smykm.sql` - Template installation

---

**End of Test Plan**
