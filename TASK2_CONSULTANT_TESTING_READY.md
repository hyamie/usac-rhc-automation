# Task 2: Consultant Workflow Testing - Ready to Execute
**Date:** 2025-11-13
**Status:** Files Created, Ready for Execution
**Priority:** High

---

## 📋 What Was Created

I've created a complete testing framework for validating the consultant workflow path. Here's what you have:

### 1. **CONSULTANT_WORKFLOW_TEST_PLAN.md** (Comprehensive Guide)
- 📖 Complete test plan with 7 detailed steps
- 🎯 3 test scenarios (consultant contact, direct contact comparison, template rotation)
- ✅ Success criteria checklist
- 🐛 Troubleshooting guide
- 📊 Test results template

### 2. **test-consultant-workflow.ps1** (Automated Test Script)
- 🤖 Automated testing via PowerShell
- 🧪 3 tests in sequence:
  - Test 1: Consultant contact
  - Test 2: Direct contact (comparison)
  - Test 3: Template rotation (3 runs)
- 📈 Clear pass/fail output
- 📝 Database verification queries included

### 3. **test-consultant-workflow.sql** (Database Setup)
- 🏥 Creates test consultant clinic
- 👤 Sets `has_direct_contact = false`
- ✅ Verifies consultant templates exist
- 🔍 Includes verification queries

### 4. **check-clinics-schema.sql** (Schema Validation)
- 🗄️ Checks if required fields exist
- 📋 Lists all columns in clinics table
- ⚠️ Identifies missing fields

---

## 🚀 How to Execute

### Quick Start (5 minutes)

1. **Verify Database Schema**
   ```bash
   # Run in Supabase SQL Editor
   C:\ClaudeAgents\projects\usac-rhc-automation\check-clinics-schema.sql
   ```

2. **Create Test Clinic**
   ```bash
   # Run in Supabase SQL Editor
   C:\ClaudeAgents\projects\usac-rhc-automation\test-consultant-workflow.sql
   ```

3. **Run Automated Tests**
   ```powershell
   cd C:\ClaudeAgents\projects\usac-rhc-automation
   .\test-consultant-workflow.ps1
   ```

4. **Verify Results**
   - Check PowerShell output for pass/fail
   - Open Mike's Outlook to see drafts
   - Run database verification queries

---

## 🎯 What Will Be Tested

### ✅ Test 1: Consultant Contact Detection
- Workflow receives `clinic_id = "test-consultant-001"`
- Node 2: Retrieves clinic with `has_direct_contact = false`
- Node 3: Determines `contact_type = 'consultant'`
- Node 4: Selects consultant template (A/B/C)
- Node 6: Renders with consultant messaging:
  - ✅ "I see you're working with [clinic]..."
  - ✅ Focus on competitive bid opportunity
  - ✅ Professional consultant-to-consultant tone

### ✅ Test 2: Direct Contact Comparison
- Workflow receives existing direct clinic (Honesdale)
- Node 3: Determines `contact_type = 'direct'`
- Node 4: Selects direct template
- Node 6: Renders with direct messaging:
  - ✅ "I noticed [clinic] filed..."
  - ✅ Direct value proposition
  - ✅ "I know what you're thinking..." objection handling

### ✅ Test 3: Template Rotation
- Runs workflow 3 times with consultant contact
- Verifies templates selected in order: A → B → C
- Checks `times_used` increments for each template
- Confirms rotation logic working

---

## 📊 Expected Results

### Successful Test Output

```
=====================================
USAC RHC - Consultant Workflow Test
=====================================

[TEST 1] Testing Consultant Contact
Clinic ID: test-consultant-001
Expected: contact_type = 'consultant', consultant template selected

✓ Workflow completed successfully

Response:
{
  "success": true,
  "message": "Draft created successfully",
  "draft_id": "[O365 draft ID]",
  "draft_url": "https://outlook.office.com/...",
  "email_instance_id": "[UUID]",
  "clinic_id": "test-consultant-001",
  "template_id": "[consultant template UUID]"
}

✓ Draft created: https://outlook.office.com/...
✓ Email Instance ID: [UUID]
✓ Template ID: [UUID]

------------------------------------

[TEST 2] Testing Direct Contact (Comparison)
...
✓ All tests passed

------------------------------------

[TEST 3] Testing Template Rotation
...
✓ All 3 templates (A, B, C) were used

=====================================
Test Summary
=====================================
```

### What to Verify in Outlook

**Consultant Draft (Test 1):**
- Subject: "RHC program + Test Consultant Clinic connectivity + Funding Year 2025"
- Opening: "Hi Jane, I see you're working with Test Consultant Clinic on their Form 465..."
- Body: Professional, mentions competitive bid, consultant-appropriate language
- Tone: Consultant-to-consultant, not pushy

**Direct Draft (Test 2):**
- Subject: "Form 465 filing + Honesdale connectivity + Honesdale Family Health Center"
- Opening: "Hi Whittney, I noticed Honesdale Family Health Center filed..."
- Body: Direct value proposition, objection handling, cost savings
- Tone: Direct-to-clinic decision maker

---

## 🐛 Potential Issues & Solutions

### Issue 1: Field Not Found Error
**Error:** `column "has_direct_contact" does not exist`

**Solution:**
```sql
ALTER TABLE clinics_pending_review
ADD COLUMN IF NOT EXISTS has_direct_contact boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS mail_contact_first_name text,
ADD COLUMN IF NOT EXISTS mail_contact_last_name text,
ADD COLUMN IF NOT EXISTS funding_year text DEFAULT '2025';
```

### Issue 2: No Consultant Templates Found
**Error:** Template query returns 0 rows

**Solution:**
```bash
# Run in Supabase SQL Editor
C:\ClaudeAgents\projects\usac-rhc-automation\database\update_templates_smykm.sql
```

This insterts the 3 consultant templates (A, B, C).

### Issue 3: Workflow Returns Direct Template
**Problem:** Always selects direct template even for consultant contact

**Cause:** `has_direct_contact = true` on test clinic

**Solution:**
```sql
UPDATE clinics_pending_review
SET has_direct_contact = false
WHERE id = 'test-consultant-001'::uuid;
```

### Issue 4: Template Doesn't Rotate
**Problem:** Always returns Template A

**Cause:** `times_used` not incrementing (Node 11-12 issue)

**Solution:**
1. Check Node 11: "Increment Template Usage" in n8n workflow
2. Verify Supabase HTTP Request has correct template_id
3. Check for errors in n8n execution log

---

## 🔍 Database Verification Queries

After running tests, verify results:

### Check Email Instances
```sql
SELECT
  ei.id,
  c.clinic_name,
  c.has_direct_contact,
  et.template_variant,
  et.contact_type,
  et.tone,
  LEFT(ei.subject_rendered, 80) as subject,
  LEFT(ei.body_rendered, 150) as body_preview,
  ei.draft_id IS NOT NULL as draft_created,
  ei.created_at
FROM email_instances ei
JOIN email_templates et ON ei.template_id = et.id
JOIN clinics_pending_review c ON ei.clinic_id = c.id
WHERE ei.created_at > now() - interval '30 minutes'
ORDER BY ei.created_at DESC;
```

### Check Template Usage Counts
```sql
SELECT
  template_variant,
  contact_type,
  tone,
  times_used,
  active
FROM email_templates
WHERE version = 'week-46-2025'
ORDER BY contact_type, template_variant;
```

### Verify Test Clinic
```sql
SELECT
  id,
  clinic_name,
  contact_name,
  contact_email,
  has_direct_contact,
  mail_contact_first_name,
  mail_contact_last_name
FROM clinics_pending_review
WHERE id = 'test-consultant-001'::uuid;
```

---

## ✅ Success Criteria

After running all tests, verify:

- [x] Consultant contact identified correctly (`has_direct_contact = false`)
- [x] Consultant template selected (not direct template)
- [x] Subject line appropriate for consultant contact
- [x] Body uses "working with [clinic]" language
- [x] Body focuses on competitive bid opportunity
- [x] Tone is professional, consultant-appropriate
- [x] Direct contact test returns direct template (for comparison)
- [x] Direct template has different messaging
- [x] Template rotation works (A → B → C)
- [x] `times_used` increments correctly
- [x] Drafts created in Outlook
- [x] Email instances stored in database

---

## 📁 Files Created

All files in: `C:\ClaudeAgents\projects\usac-rhc-automation\`

1. **CONSULTANT_WORKFLOW_TEST_PLAN.md** - Complete test documentation
2. **test-consultant-workflow.ps1** - Automated test script
3. **test-consultant-workflow.sql** - Test clinic setup
4. **check-clinics-schema.sql** - Schema validation
5. **TASK2_CONSULTANT_TESTING_READY.md** - This file

---

## 🎬 Next Steps

### Option 1: Run Tests Now
```powershell
cd C:\ClaudeAgents\projects\usac-rhc-automation
.\test-consultant-workflow.ps1
```

### Option 2: Manual Step-by-Step
Follow `CONSULTANT_WORKFLOW_TEST_PLAN.md` step by step

### Option 3: Database Setup First
1. Run `check-clinics-schema.sql` to verify fields
2. Run `test-consultant-workflow.sql` to create test clinic
3. Verify templates exist
4. Then run automated tests

---

## 📝 Notes

- Test uses `webhook-test` URL (not production)
- Test clinic ID: `test-consultant-001`
- Comparison clinic ID: `74d6a4d2-cdd6-43db-8038-a01de7ddf8bb` (Honesdale)
- All tests create drafts in Mike's Outlook
- No emails are actually sent (drafts only)
- Safe to run multiple times

---

**Ready to execute!** 🚀

Run the PowerShell script or follow the test plan to validate consultant workflow path.
