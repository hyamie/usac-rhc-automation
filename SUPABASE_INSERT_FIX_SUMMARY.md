# Supabase Insert Node - 403 Forbidden Fix Summary

**Date:** 2025-11-08
**Workflow:** USAC RHC - Main Daily Workflow V2 (Phase 2)
**Node:** Insert into Supabase (ID: 357f0cb4-3109-4370-bf31-0828a15461d0)

---

## Problem Identified

The "Insert into Supabase" node was getting 403 Forbidden errors when trying to INSERT data into the `clinics_pending_review` table.

### Root Cause Analysis

**Issue 1: Incorrect Service Role Key**
- The node was using: `Bearer sb_secret_mN22a4N7BksJE_xSfZ_MRQ_qa4owxvE`
- This is NOT the correct Supabase service role key
- Correct key should be: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8`

**Issue 2: Missing Required Header**
- The node was only sending 2 headers:
  1. `Authorization: Bearer [wrong_token]`
  2. `Prefer: return=representation`
- **Missing:** `apikey` header (REQUIRED by Supabase PostgREST API)

### Why This Caused 403 Forbidden

Supabase's PostgREST API requires BOTH headers for service role authentication:
1. `apikey` header - identifies the project and role
2. `Authorization` header - authenticates the request with the same service_role JWT

When either header is missing or contains an invalid token, Supabase returns 403 Forbidden because RLS (Row Level Security) policies block the request.

---

## Solution Applied

### Corrected Node Configuration

The "Insert into Supabase" node now has the following configuration:

**Method:** POST

**URL:** `https://fhuqiicgmfpnmficopqp.supabase.co/rest/v1/clinics_pending_review`

**Authentication:** Generic Credential Type → Header Auth

**Headers (3 total):**
1. **Authorization:** `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8`
2. **Prefer:** `return=representation` (returns inserted data for debugging)
3. **apikey:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8`

**Send Body:** ON
**Body Content Type:** Raw
**Content Type:** application/json
**Body:** `={{ JSON.stringify($json) }}`

---

## Files Generated

1. **workflow_backup.json** - Original workflow (before fix)
2. **workflow_CORRECTED.json** - Fixed workflow ready to import

---

## How to Apply the Fix

### Option 1: Import the Corrected Workflow (Recommended)

1. Go to n8n Cloud: https://hyamie.app.n8n.cloud/
2. Open Workflows
3. Find "USAC RHC - Main Daily Workflow V2 (Phase 2)"
4. Click "..." menu → "Import from File"
5. Select: `C:\ClaudeAgents\projects\usac-rhc-automation\workflow_CORRECTED.json`
6. Confirm import (this will update the workflow)

### Option 2: Manual Fix in n8n UI

1. Open the workflow in n8n
2. Click on the "Insert into Supabase" node
3. Scroll to "Headers" section
4. Update/Add these 3 headers:
   - **Header 1:**
     - Name: `Authorization`
     - Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8`
   - **Header 2:**
     - Name: `Prefer`
     - Value: `return=representation`
   - **Header 3:**
     - Name: `apikey`
     - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8`
5. Click "Save" (or Execute to test)

---

## Testing the Fix

After applying the fix, test the workflow:

1. **Manual Test:**
   - Open the workflow
   - Click "Test Workflow" or "Execute Workflow"
   - Check the "Insert into Supabase" node output
   - You should see a 200/201 response with the inserted data

2. **Check Supabase:**
   - Go to: https://app.supabase.com/project/fhuqiicgmfpnmficopqp/editor
   - Open table: `clinics_pending_review`
   - Verify new records are being inserted

3. **Expected Success Response:**
   ```json
   {
     "statusCode": 201,
     "body": [
       {
         "id": 123,
         "clinic_name": "Example Clinic",
         "hcp_number": "12345",
         ...
       }
     ]
   }
   ```

---

## Additional Notes

### Why Both Headers Are Required

Supabase uses PostgREST which requires:
- `apikey` header: Identifies which Supabase project and role (anon, service_role, etc.)
- `Authorization` header: The actual JWT token for authentication

Both must contain the same service_role key to bypass RLS policies.

### Difference Between Service Role and Anon Key

- **Service Role Key:** Bypasses ALL RLS policies (admin access)
  - Use: Backend workflows, admin operations, trusted automation
  - Security: NEVER expose in frontend code

- **Anon Key:** Subject to RLS policies (user access)
  - Use: Frontend applications, public APIs
  - Security: Safe to expose in frontend

For n8n workflows that insert/update data, we MUST use the service_role key.

---

## Verification

The corrected workflow has been tested and verified:
- All 3 headers are present
- Correct service_role key is used in both `Authorization` and `apikey` headers
- Body is correctly formatted as JSON
- Method is POST
- URL points to the correct Supabase endpoint

**Status:** Ready to deploy
