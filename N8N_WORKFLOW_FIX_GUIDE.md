# n8n Workflow Fix Guide
## Update Workflow to Use New Database Columns

**Date:** November 9, 2025
**Workflow:** Main Daily Workflow V2 (Phase 2)
**Status:** ✅ Database Updated | ⏳ Workflow Needs Updating

---

## What Changed

### ✅ Database Migration Complete
4 new columns added to Supabase:
1. `application_number` (text)
2. `zip` (text)
3. `contact_phone` (text)
4. `additional_documents` (jsonb)

### ⏳ Workflow Needs Updates
The n8n workflow is already trying to insert these fields, but it's failing because:
- The columns didn't exist before (now fixed ✅)
- The workflow may need minor adjustments for the JSONB document field

---

## Step-by-Step Fix Instructions

### Step 1: Open n8n Workflow (2 minutes)

1. Go to: https://hyamie.app.n8n.cloud
2. Sign in to your n8n account
3. Find workflow: **"USAC RHC - Main Daily Workflow V2 (Phase 2)"**
4. Click to open the workflow editor

### Step 2: Verify "Process & Extract All Fields" Node (3 minutes)

1. Find the node named **"Process & Extract All Fields"**
2. Click to open it
3. Look for the JavaScript code section
4. **Verify these lines exist:**

```javascript
const processed = {
  // Core identifiers
  hcp_number: data.hcp_number || data.health_care_provider_number,
  application_number: data.application_number || data.form_465_application_number,

  // Clinic information
  clinic_name: data.site_name || data.health_care_provider_name,
  city: data.site_city,
  state: data.site_state,
  zip: data.site_zip || data.site_zip_code,  // ✅ This should exist

  // Contact info
  contact_phone: data.contact_phone_number || data.contact_telephone_number,  // ✅ This should exist

  // ... other fields ...
};
```

**If `zip` and `contact_phone` are already there:** ✅ Good, continue to Step 3

**If they're missing:** Add them manually in the code

### Step 3: Add Document Links Processing (10 minutes)

**This is the NEW part** - we need to combine the 20 document link columns into one JSONB field.

1. Find the **"Process & Extract All Fields"** node
2. In the JavaScript code, **ADD** this function at the top:

```javascript
// Function to collect document links
function collectDocumentLinks(data) {
  const rfpLinks = [];
  const additionalDocs = [];

  // Collect RFP links (RFP 1-10)
  for (let i = 1; i <= 10; i++) {
    const rfpLink = data[`rfp_${i}`] || data[`RFP_${i}`] || data[`rfp${i}`];
    if (rfpLink && rfpLink.trim() !== '') {
      rfpLinks.push(rfpLink.trim());
    }
  }

  // Collect Additional Document links (1-10)
  for (let i = 1; i <= 10; i++) {
    const docLink = data[`additional_document_${i}`] || data[`Additional_Document_${i}`] || data[`additional_doc_${i}`];
    if (docLink && docLink.trim() !== '') {
      additionalDocs.push(docLink.trim());
    }
  }

  return {
    rfp_links: rfpLinks,
    additional_docs: additionalDocs
  };
}
```

3. Then **ADD** this field to the `processed` object:

```javascript
const processed = {
  // ... existing fields ...

  // Document links (JSONB)
  additional_documents: collectDocumentLinks(data),

  // ... rest of fields ...
};
```

### Step 4: Update Supabase Insert Node (5 minutes)

1. Find the **"Supabase"** node (or "Insert to Supabase" node)
2. Click to open it
3. Verify these fields are mapped:
   - `application_number` → `{{ $json.application_number }}`
   - `zip` → `{{ $json.zip }}`
   - `contact_phone` → `{{ $json.contact_phone }}`
   - `additional_documents` → `{{ $json.additional_documents }}`

**If using the native Supabase node:**
- The field mappings should automatically pick up from the previous node
- Just verify they're there in the field list

**If using HTTP Request node:**
- Make sure the JSON body includes all 4 fields
- Ensure headers are correct (apikey, Authorization, Content-Type)

### Step 5: Test the Workflow (5 minutes)

1. **Save** the workflow (Ctrl+S or Save button)
2. Click **"Execute Workflow"** button
3. Check the execution log:
   - ✅ All nodes should show green checkmarks
   - ✅ Supabase insert should return `201 Created`
   - ❌ If you see errors, check the error message

### Step 6: Verify Data in Supabase (2 minutes)

1. Open Supabase: https://fhuqiicgmfpnmficopqp.supabase.co
2. Go to **Table Editor**
3. Select `clinics_pending_review` table
4. Find the most recent row
5. **Verify these columns have data:**
   - `application_number` - should have value like "RHC46500001741"
   - `zip` - should have ZIP code
   - `contact_phone` - should have phone number
   - `additional_documents` - should have JSON object with arrays

---

## Expected Output

### Before Fix
```
Error: PGRST204
Column 'application_number' not found in schema cache
Status: 400 Bad Request
```

### After Fix
```
Success: Record inserted
Status: 201 Created

Data in Supabase:
- application_number: "RHC46500001741" ✅
- zip: "18431-1459" ✅
- contact_phone: "(570) 555-1234" ✅
- additional_documents: {
    "rfp_links": ["http://...", "http://..."],
    "additional_docs": ["http://..."]
  } ✅
```

---

## Troubleshooting

### Error: "Column does not exist"
**Solution:** Schema cache needs reload
1. Supabase → Settings → API → "Reload schema"
2. Wait 30 seconds
3. Try workflow again

### Error: "Invalid input syntax for type json"
**Problem:** `additional_documents` field is malformed
**Solution:** Make sure the `collectDocumentLinks()` function returns valid JSON
- Check for missing commas
- Verify array syntax is correct

### Error: "Null value violates not-null constraint"
**Problem:** Required field is missing
**Solution:** These fields are REQUIRED:
- `hcp_number`
- `clinic_name`
- `filing_date`
- `form_465_hash`
- `state`

### Workflow Runs but No Data Appears
**Problem:** Workflow might be in test mode or using wrong credentials
**Solution:**
1. Check workflow is using correct Supabase credentials
2. Verify `SUPABASE_SERVICE_KEY` is set (not anon key)
3. Check RLS policies aren't blocking inserts

---

## Complete Code Example

### Full "Process & Extract All Fields" Node Code

```javascript
// Function to collect document links from 20 separate USAC columns
function collectDocumentLinks(data) {
  const rfpLinks = [];
  const additionalDocs = [];

  // Collect RFP links (RFP 1-10)
  for (let i = 1; i <= 10; i++) {
    const rfpLink = data[`rfp_${i}`] || data[`RFP_${i}`] || data[`rfp${i}`];
    if (rfpLink && rfpLink.trim() !== '') {
      rfpLinks.push(rfpLink.trim());
    }
  }

  // Collect Additional Document links (1-10)
  for (let i = 1; i <= 10; i++) {
    const docLink = data[`additional_document_${i}`] || data[`Additional_Document_${i}`] || data[`additional_doc_${i}`];
    if (docLink && docLink.trim() !== '') {
      additionalDocs.push(docLink.trim());
    }
  }

  return {
    rfp_links: rfpLinks,
    additional_docs: additionalDocs
  };
}

// Function to create hash from HCP number and filing date
function createFormHash(hcpNumber, filingDate) {
  const crypto = require('crypto');
  const hashInput = `${hcpNumber}-${filingDate}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
}

// Main processing
const items = $input.all();
const processedItems = [];

for (const item of items) {
  const data = item.json;

  // Create unique hash for this filing
  const filingDate = data.filing_date || data.posting_date || new Date().toISOString().split('T')[0];
  const hash = createFormHash(data.hcp_number || data.health_care_provider_number, filingDate);

  const processed = {
    // Core identifiers
    hcp_number: data.hcp_number || data.health_care_provider_number,
    application_number: data.application_number || data.form_465_application_number,
    form_465_hash: hash,

    // Clinic information
    clinic_name: data.site_name || data.health_care_provider_name,
    address: data.site_address || data.service_delivery_site_physical_address,
    city: data.site_city,
    state: data.site_state,
    zip: data.site_zip || data.site_zip_code,

    // Dates
    filing_date: filingDate,
    posting_date: data.posting_date || null,
    allowable_contract_start_date: data.allowable_contract_start_date || null,

    // Contact information
    contact_phone: data.contact_phone_number || data.contact_telephone_number,

    // Mail contact (different from main contact)
    mail_contact_name: data.mail_contact_first_name && data.mail_contact_last_name
      ? `${data.mail_contact_first_name} ${data.mail_contact_last_name}`
      : null,
    mail_contact_email: data.mail_contact_email || null,
    mail_contact_company: data.mail_contact_org_name || null,

    // Service details
    description_of_services: data.descriptions_of_services_requested || null,
    program_type: data.program_type || 'Telecom',

    // Document links (JSONB)
    additional_documents: collectDocumentLinks(data),

    // PDF link
    form_465_pdf_url: data.link_to_fcc_form_pdf || null,

    // Metadata
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  processedItems.push({ json: processed });
}

return processedItems;
```

---

## Next Steps After Fix

Once the workflow is working:

1. ✅ Test with real USAC data
2. ✅ Verify all fields populate correctly
3. ✅ Check document links display in dashboard
4. ✅ Schedule workflow to run daily at 7 AM
5. ✅ Monitor for errors over first week

---

## Files to Reference

- **Database Migration:** `database/schema_update_v3_alignment_fix.sql`
- **Workflow Export:** `workflows/main_daily_workflow_v2_export.json`
- **Complete Analysis:** `SCHEMA_ALIGNMENT_REPORT.md`
- **Field Comparison:** `FIELD_COMPARISON_TABLE.md`

---

## Summary

**Time Required:** ~25 minutes
**Risk Level:** LOW (database already updated, just fixing workflow)
**Rollback:** Can revert workflow to previous version if needed

**Status Checklist:**
- ✅ Database migration complete
- ⏳ Open n8n workflow
- ⏳ Add document collection function
- ⏳ Update field mappings
- ⏳ Test workflow
- ⏳ Verify data in Supabase
- ⏳ Activate daily schedule

---

**Ready? Open n8n and let's fix this workflow!**

https://hyamie.app.n8n.cloud
