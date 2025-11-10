# USAC RHC Automation - Quick Fix Summary

**Date:** November 9, 2025
**Issue:** n8n workflow failing with PGRST204 error
**Root Cause:** `application_number` column missing from database

---

## THE PROBLEM

The n8n workflow tries to insert these fields:
- `application_number` ❌ DOES NOT EXIST IN DATABASE
- `zip` ❌ DOES NOT EXIST IN DATABASE
- `contact_phone` ❌ DOES NOT EXIST IN DATABASE
- `additional_documents` ❌ DOES NOT EXIST IN DATABASE (for 20 document links)

This causes a `PGRST204` (column not found) error and workflow fails.

---

## THE SOLUTION

### 1. Run Database Migration (5 minutes)

Open Supabase SQL Editor and run:

```bash
# File location
C:\ClaudeAgents\projects\usac-rhc-automation\database\schema_update_v3_alignment_fix.sql
```

This adds:
- `application_number` TEXT
- `zip` TEXT
- `contact_phone` TEXT
- `additional_documents` JSONB

### 2. Reload Schema Cache (1 minute)

- Go to Supabase Dashboard
- Settings → API → Click "Reload Schema"
- Wait 30 seconds

### 3. Update n8n Workflow (10 minutes)

Edit the "Process & Extract All Fields" node and add these lines:

**After line with `state:`**
```javascript
zip: data.site_zip || data.site_zip_code,
```

**After line with `contact_email:`**
```javascript
contact_phone: data.contact_phone_number || data.contact_telephone_number,
```

**Before the final `};`**
```javascript
additional_documents: {
  rfp_links: [
    data.rfp_1, data.rfp_2, data.rfp_3, data.rfp_4, data.rfp_5,
    data.rfp_6, data.rfp_7, data.rfp_8, data.rfp_9, data.rfp_10
  ].filter(link => link && link.trim() !== ''),
  additional_docs: [
    data.additional_document_1, data.additional_document_2, data.additional_document_3,
    data.additional_document_4, data.additional_document_5, data.additional_document_6,
    data.additional_document_7, data.additional_document_8, data.additional_document_9,
    data.additional_document_10
  ].filter(link => link && link.trim() !== '')
},
```

**IMPORTANT:** Also update the duplicate node "Process & Extract All Fields1" with the same changes.

### 4. Test (5 minutes)

- Click "Execute Workflow" in n8n
- Check for errors (should be none)
- Verify data in Supabase Table Editor
- Confirm `application_number`, `zip`, `contact_phone`, and `additional_documents` are populated

---

## EXPECTED RESULT

### Before Fix
```
ERROR: PGRST204 - Column 'application_number' not found
Workflow Status: FAILED ❌
Data Inserted: NO
```

### After Fix
```
SUCCESS: 201 Created
Workflow Status: SUCCESS ✅
Data Inserted: YES
All fields populated correctly
```

---

## DETAILED DOCUMENTATION

For complete analysis, field mappings, and step-by-step instructions, see:

**C:\ClaudeAgents\projects\usac-rhc-automation\SCHEMA_ALIGNMENT_REPORT.md**

---

## FILES CREATED

1. **SCHEMA_ALIGNMENT_REPORT.md** - Complete 10-part analysis
2. **schema_update_v3_alignment_fix.sql** - Database migration script
3. **main_daily_workflow_v2_export.json** - Current workflow backup
4. **QUICK_FIX_SUMMARY.md** - This file

---

## CHECKLIST

- [ ] Run schema_update_v3_alignment_fix.sql in Supabase
- [ ] Reload schema cache in Supabase
- [ ] Update "Process & Extract All Fields" node in n8n
- [ ] Update "Process & Extract All Fields1" node in n8n
- [ ] Save n8n workflow
- [ ] Test workflow execution
- [ ] Verify data in Supabase
- [ ] Export updated workflow JSON
- [ ] Commit changes to Git

---

**Total Time: ~20 minutes**
**Risk Level: LOW** (adding nullable columns, no data loss)
**Rollback: Easy** (columns can be dropped if needed)
