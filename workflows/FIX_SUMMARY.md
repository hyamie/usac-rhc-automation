# Request for Services Field - Fix Summary

## Problem Identified ✅
The `request_for_services` field from the USAC Form 465 API is being **captured** by the API call but **filtered out** before it reaches Supabase.

### Evidence
Looking at the test data in the workflow (`pinData`):
```json
{
  "program": "Telecom",
  "application_number": "RHC46500001741",
  "request_for_services": "Voice",  ← THIS FIELD EXISTS IN API RESPONSE
  ...
}
```

But after the "Process & Extract All Fields" node, it disappears:
```json
{
  "hcp_number": "50472",
  "program_type": "Telecom",
  // ❌ request_for_services is MISSING
  "service_type": null,
  ...
}
```

## Root Cause
The JavaScript code in the **"Process & Extract All Fields1"** node does NOT include this line:
```javascript
request_for_services: data.request_for_services || null,
```

## Fix Required

### Step 1: Database Migration ✅ (Created)
File: `database/migrations/add_request_for_services.sql`

This adds the column to store the data:
```sql
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS request_for_services text;
```

### Step 2: Update n8n Workflow (Manual - See Instructions Below)
Location: Node "Process & Extract All Fields1" → JavaScript Code

**Current code (line ~60-65):**
```javascript
// Program information
program_type: 'Telecom',
service_type: data.service_type || data.type_of_service,
description_of_services: data.narrative_description || data.description,
```

**Updated code (ADD ONE LINE):**
```javascript
// Program information
program_type: 'Telecom',
request_for_services: data.request_for_services || null,  // ← ADD THIS
service_type: data.service_type || data.type_of_service,
description_of_services: data.narrative_description || data.description,
```

## Why This Matters
1. **Sorting/Filtering**: Users can filter by service type (Voice, Internet, etc.)
2. **Email Template Selection**: Different email templates for Voice vs Internet services
3. **Reporting**: Track which service types are most popular
4. **Priority Scoring**: Voice services might have different priority than data services

## Values You'll See
Based on USAC data, common values include:
- "Voice" (traditional phone services)
- "Internet" (broadband)
- "Data Circuit"
- "Bundled Services"
- "Dark Fiber"
- etc.

## Manual Steps to Complete Fix

### 1. Run Database Migration
```bash
# Go to Supabase SQL Editor: https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp/sql

# Paste and run the contents of:
# database/migrations/add_request_for_services.sql
```

### 2. Update n8n Workflow
```bash
# Go to n8n: https://hyamie.app.n8n.cloud

# 1. Open workflow: "USAC RHC - Main Daily Workflow V2 (Phase 2)"
# 2. Click on node: "Process & Extract All Fields1"
# 3. Add the line of code as shown above
# 4. Click "Save"
```

### 3. Test the Workflow
```bash
# In n8n:
# 1. Click "Execute Workflow"
# 2. Check the output of "Process & Extract All Fields1"
# 3. Verify request_for_services appears in the data
# 4. Check Supabase to confirm the field is populated
```

## Files Created
- ✅ `database/migrations/add_request_for_services.sql` - Database migration
- ✅ `workflows/WORKFLOW_UPDATE_INSTRUCTIONS.md` - Detailed instructions
- ✅ `workflows/FIX_SUMMARY.md` - This summary

## Next Steps
1. Run the database migration in Supabase
2. Update the n8n workflow JavaScript code
3. Test with existing pinned data
4. Verify the webapp can now sort by request_for_services

**Note**: The workflow is working correctly except for this missing field. Adding one line of code will fix it without breaking anything.
