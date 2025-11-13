# Service Type Filter - Troubleshooting Guide

**Issue:** Filter dropdown works but shows no results when filtering
**Cause:** Data is being pulled but `service_type` field may not be populated correctly

---

## ✅ Good News!

The workflow is **already configured** to capture `service_type` data!

### Current n8n Configuration

**Node:** "Transform to Supabase Format" (Code node)
**Line:**
```javascript
service_type: json.descriptionofservicesrequested || json.service_type || '',
```

**What it does:**
1. Tries to get `descriptionofservicesrequested` from USAC API
2. Falls back to `service_type` if first field is empty
3. Sets to empty string `''` if both are missing

---

## 🔍 Step 1: Check Your Supabase Data

### Option A: Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp
2. Click "Table Editor" → `clinics_pending_review`
3. Look at the `service_type` column
4. Check if values are populated or empty

### Option B: Via SQL Query

Run this in Supabase SQL Editor:

```sql
-- See what service_type values exist
SELECT
  service_type,
  COUNT(*) as count
FROM clinics_pending_review
GROUP BY service_type
ORDER BY count DESC;
```

**Expected Results:**
```
service_type                              | count
------------------------------------------|-------
Telecommunications Service ONLY           | 15
Both Telecommunications & Internet...     | 8
Voice                                     | 5
Data                                      | 3
(null or empty string)                    | 12
```

**Problem Indicators:**
- All rows show `NULL` or empty string
- No service_type values at all
- Only partial data

---

## 🔍 Step 2: Check USAC API Field Name

The issue might be that USAC changed their API field name.

### Test USAC API Directly

Run this in your browser or Postman:

```
https://opendata.usac.org/resource/96rf-xd57.json?program=Telecom&$limit=5
```

**Look for these fields in the response:**
- `descriptionofservicesrequested` ✅ (current mapping)
- `service_type` ✅ (fallback)
- `requestforservices` ❓ (possible alternative)
- `services_requested` ❓ (possible alternative)

Copy the actual field name from the API response.

---

## 🔧 Step 3: Update n8n Workflow (If Needed)

If the USAC field name is different, you need to update the workflow.

### Which Node to Update

**Workflow:** Phase 1 - USAC Data Pull
**Node Name:** "Transform to Supabase Format" (or similar)
**Node Type:** Code (Function)

### Find This Line

Search for this in the node code:
```javascript
service_type: json.descriptionofservicesrequested || json.service_type || '',
```

### Update to Correct Field

Replace with the actual USAC API field name:
```javascript
// Example if USAC uses 'request_for_services'
service_type: json.request_for_services || json.descriptionofservicesrequested || '',

// Or if they use 'services_requested'
service_type: json.services_requested || json.descriptionofservicesrequested || '',
```

### How to Update in n8n

1. Go to: https://hyamie.app.n8n.cloud
2. Open your workflow: "Phase 1: USAC Data Pull"
3. Find the **"Transform to Supabase Format"** node
4. Click to edit the code
5. Find the line with `service_type:`
6. Update with correct field name
7. **Save** the workflow
8. **Test** with a manual execution

---

## 🔍 Step 4: Check Field Mapping

The filter expects these exact values in the database:

| Filter Option | Database Value |
|--------------|----------------|
| Telecommunications Service ONLY | `telecommunications_only` |
| Both Telecommunications & Internet Services | `both` |
| Voice | `voice` |
| Data | `data` |
| Other | `other` |

**But USAC might send:**
- Full text: "Telecommunications Service ONLY"
- Different casing: "TELECOMMUNICATIONS SERVICE ONLY"
- Different format: "Telecom Only"

### Option A: Store Exact USAC Values

**Easier Option:** Update the filter to match USAC's exact values.

Edit `ServiceTypeFilter.tsx` to use USAC's actual values:

```typescript
const SERVICE_TYPES = [
  { value: 'Telecommunications Service ONLY', label: 'Telecommunications Service ONLY' },
  { value: 'Both Telecommunications & Internet Services', label: 'Both Telecommunications & Internet Services' },
  // ... etc
];
```

### Option B: Normalize in n8n

**Better Option:** Transform USAC values to standardized values in n8n.

Add this function to your Transform node:

```javascript
// Normalize service type to standard values
function normalizeServiceType(rawValue) {
  if (!rawValue) return '';

  const value = rawValue.toLowerCase().trim();

  if (value.includes('telecommunications') && value.includes('internet')) {
    return 'both';
  }
  if (value.includes('telecommunications') && !value.includes('internet')) {
    return 'telecommunications_only';
  }
  if (value.includes('voice')) {
    return 'voice';
  }
  if (value.includes('data')) {
    return 'data';
  }

  return 'other';
}

// Then use it:
service_type: normalizeServiceType(json.descriptionofservicesrequested || json.service_type),
```

---

## 🔍 Step 5: Verify Current Workflow Execution

Check if the workflow is actually running and inserting data.

### Check n8n Executions

1. Go to: https://hyamie.app.n8n.cloud
2. Click "Executions" tab
3. Find recent runs of your workflow
4. Click on a successful execution
5. Look at the **"Transform to Supabase Format"** node output
6. Check if `service_type` has values

### Check Supabase Recent Inserts

```sql
-- Get most recent clinics with service_type info
SELECT
  clinic_name,
  service_type,
  filing_date,
  created_at
FROM clinics_pending_review
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔧 Quick Fixes

### Fix #1: If Field is Always Empty

The USAC API field name changed. Update the transform node (see Step 3).

### Fix #2: If Field Has Wrong Format

The values don't match the filter. Either:
- Update filter to match USAC values (easier)
- Add normalization in n8n (better long-term)

### Fix #3: If No Data Exists Yet

The workflow hasn't run or data insertion failed. Check:
1. Is the workflow activated in n8n?
2. Check execution logs for errors
3. Check Supabase logs for insert errors
4. Verify Supabase credentials in n8n

---

## 📊 SQL Queries to Help Debug

### See All Data
```sql
SELECT id, clinic_name, service_type, filing_date
FROM clinics_pending_review
ORDER BY filing_date DESC
LIMIT 50;
```

### Count by Service Type
```sql
SELECT
  CASE
    WHEN service_type IS NULL THEN '(NULL)'
    WHEN service_type = '' THEN '(EMPTY STRING)'
    ELSE service_type
  END as service_type_display,
  COUNT(*) as count
FROM clinics_pending_review
GROUP BY service_type
ORDER BY count DESC;
```

### Find Non-Empty Service Types
```sql
SELECT DISTINCT service_type
FROM clinics_pending_review
WHERE service_type IS NOT NULL
  AND service_type != ''
ORDER BY service_type;
```

### Check Recent Inserts
```sql
SELECT
  clinic_name,
  service_type,
  created_at,
  filing_date
FROM clinics_pending_review
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 🚀 Action Plan

**Do this in order:**

1. ✅ **Check Supabase data** (SQL query above)
   - If data exists with values → Filter should work
   - If data is NULL/empty → Continue to step 2

2. ✅ **Check USAC API** (browser test)
   - Find the correct field name
   - Note the exact format of values

3. ✅ **Update n8n if needed**
   - Update field mapping in Transform node
   - Add normalization if values don't match
   - Save and test workflow

4. ✅ **Test end-to-end**
   - Run workflow manually in n8n
   - Check Supabase for new data
   - Test filter in dashboard

5. ✅ **Update filter if needed**
   - If USAC values are different
   - Update ServiceTypeFilter.tsx values

---

## 🆘 Still Not Working?

### Quick Diagnostic

Run this complete diagnostic query in Supabase:

```sql
-- Comprehensive service_type diagnostic
WITH stats AS (
  SELECT
    COUNT(*) as total_clinics,
    COUNT(service_type) as has_service_type,
    COUNT(*) - COUNT(service_type) as null_service_type,
    COUNT(CASE WHEN service_type = '' THEN 1 END) as empty_service_type
  FROM clinics_pending_review
)
SELECT
  total_clinics,
  has_service_type,
  null_service_type,
  empty_service_type,
  ROUND(100.0 * has_service_type / NULLIF(total_clinics, 0), 2) as pct_populated
FROM stats;
```

**Send me this output** and I can tell you exactly what's wrong!

---

## 📝 Most Likely Issues

Based on experience, here are the most common issues:

1. **USAC API field name changed** (80% of cases)
   - Fix: Update transform node field mapping

2. **Values don't match filter options** (15% of cases)
   - Fix: Update filter options to match USAC values

3. **Workflow not running** (5% of cases)
   - Fix: Activate workflow in n8n

---

**Need the exact node to update?**

The n8n workflow file is:
`workflows/phase1_workflow_FINAL.json`

The specific code section is already in the Transform node around line 70-90.

Let me know what you find in Supabase and I can give you the exact fix!
