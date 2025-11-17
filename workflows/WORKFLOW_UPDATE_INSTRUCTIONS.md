# Workflow Update Instructions: Add request_for_services Field

## Issue
The `request_for_services` field from the USAC API (e.g., "Voice", "Internet", "Data Circuit") is being filtered out before reaching Supabase. This field is needed for sorting/filtering in the webapp.

## Solution
Update the **"Process & Extract All Fields1"** node in the n8n workflow to capture this field.

## Steps to Fix

### 1. Run the Database Migration First
Go to Supabase SQL Editor and run:
```sql
-- C:\ClaudeAgents\projects\usac-rhc-automation\database\migrations\add_request_for_services.sql
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS request_for_services text;

COMMENT ON COLUMN public.clinics_pending_review.request_for_services IS
  'Type of service requested from Form 465 (e.g., Voice, Internet, Data Circuit, etc.)';

CREATE INDEX IF NOT EXISTS idx_clinics_request_for_services
ON public.clinics_pending_review(request_for_services);
```

### 2. Update n8n Workflow
1. Open the workflow: **USAC RHC - Main Daily Workflow V2 (Phase 2)**
2. Find the node named: **"Process & Extract All Fields1"**
3. In the JavaScript code, find this section (around line 60-65):

```javascript
    // Program information
    program_type: 'Telecom',
    service_type: data.service_type || data.type_of_service,
    description_of_services: data.narrative_description || data.description,
```

4. **Add this new line** right after `program_type: 'Telecom',`:

```javascript
    // Program information
    program_type: 'Telecom',
    request_for_services: data.request_for_services || null,  // ← ADD THIS LINE
    service_type: data.service_type || data.type_of_service,
    description_of_services: data.narrative_description || data.description,
```

### 3. Save and Test
1. Click "Save" in n8n
2. Test the workflow with the pinned test data
3. Verify the output includes `request_for_services: "Voice"`
4. Check that the field appears in Supabase after execution

## Expected Result
After this fix:
- The `request_for_services` field will be captured from the API
- It will be stored in Supabase
- The webapp will be able to sort/filter by this field
- Examples: "Voice", "Internet", "Data Circuit", "Bundled Services", etc.

## Files Modified
1. `database/migrations/add_request_for_services.sql` - Database migration
2. n8n workflow: "USAC RHC - Main Daily Workflow V2 (Phase 2)" - JavaScript code node

## Testing Checklist
- [ ] Database column added successfully
- [ ] Workflow updated and saved
- [ ] Test execution shows `request_for_services` in output
- [ ] Data appears in Supabase table
- [ ] Webapp can filter by this field
