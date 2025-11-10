# CHECKPOINT: Schema Cleanup & Simplification
**Date:** November 9, 2025, ~1:00 PM
**Session:** Phase 1 Workflow - Schema Alignment

---

## 🎯 CURRENT STATUS

### ✅ What's Working
1. Database has 4 new columns added: `application_number`, `zip`, `contact_phone`, `additional_documents` (JSONB)
2. Clean Phase 1 workflow created with 6 nodes
3. Historical funding endpoint identified: `https://opendata.usac.org/resource/2kme-evqq.json`
4. Loop connections fixed (documentation ready)

### ❌ Current Blocker
**Error:** Workflow trying to insert `funding_year` column that doesn't exist in Supabase

**Root Cause:** Schema has unnecessary priority/enrichment fields but is missing basic USAC data fields

---

## 🧹 DECISIONS MADE (This Session)

### 1. Schema Philosophy: Keep It Simple
- ✅ Store exactly what USAC provides - nothing more
- ❌ Delete priority scoring logic (premature optimization)
- ❌ Delete enrichment fields (not needed for Phase 1)

### 2. Historical Funding Storage: JSONB Array
**Decision:** Use JSONB array for historical funding data

**Format:**
```json
{
  "historical_funding": [
    {"year": "2023", "amount": 50000},
    {"year": "2024", "amount": 55000},
    {"year": "2025", "amount": 60000}
  ]
}
```

**Why:**
- Future-proof (year range shifts automatically)
- Flexible (can store any number of years)
- No schema changes needed annually

### 3. Required Fields from USAC API

#### From API Call 1 (Form 465 Filings) - `96rf-xd57.json`:
1. `funding_year` - **NEED TO ADD**
2. `hcp_number` - ✅ exists
3. `clinic_name` - ✅ exists
4. `application_type` - **NEED TO ADD**
5. `address`, `city`, `state`, `zip` - ✅ exists
6. `contact_first_name`, `contact_last_name`, `contact_phone`, `contact_email` - **NEED contact_email**
7. `allowable_contract_start_date` - **NEED TO ADD**
8. `contract_length` (requested_contract_period) - ✅ exists
9. `form_465_pdf_url` - **NEED TO ADD**
10. `mail_contact_first_name`, `mail_contact_last_name`, `mail_contact_org_name`, `mail_contact_phone`, `mail_contact_email` - **NEED TO ADD**
11. `service_type` (descriptions_of_services_requested) - ✅ exists
12. `additional_documents` - ✅ exists (JSONB with rfp_links + additional_docs)

#### From API Call 2 (Historical Funding) - `2kme-evqq.json`:
- `historical_funding` JSONB array - **NEED TO ADD**

---

## 📋 SCHEMA CHANGES NEEDED

### Fields to ADD:
```sql
ALTER TABLE public.clinics_pending_review
ADD COLUMN IF NOT EXISTS funding_year text,
ADD COLUMN IF NOT EXISTS application_type text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS allowable_contract_start_date timestamptz,
ADD COLUMN IF NOT EXISTS form_465_pdf_url text,
ADD COLUMN IF NOT EXISTS mail_contact_first_name text,
ADD COLUMN IF NOT EXISTS mail_contact_last_name text,
ADD COLUMN IF NOT EXISTS mail_contact_org_name text,
ADD COLUMN IF NOT EXISTS mail_contact_phone text,
ADD COLUMN IF NOT EXISTS mail_contact_email text,
ADD COLUMN IF NOT EXISTS historical_funding jsonb DEFAULT '[]'::jsonb;
```

### Fields to DELETE (Priority/Enrichment Bloat):
```sql
ALTER TABLE public.clinics_pending_review
DROP COLUMN IF EXISTS priority_score,
DROP COLUMN IF EXISTS priority_label,
DROP COLUMN IF EXISTS total_funding_3y,
DROP COLUMN IF EXISTS location_count,
DROP COLUMN IF EXISTS participation_years,
DROP COLUMN IF EXISTS enriched,
DROP COLUMN IF EXISTS contact_title,
DROP COLUMN IF EXISTS clinic_website,
DROP COLUMN IF EXISTS linkedin_url,
DROP COLUMN IF EXISTS enrichment_date;
```

### Fields to KEEP (Internal Tracking):
**QUESTION FOR USER:** Do you want to keep these for your own tracking?
- `processed` (boolean - mark when reviewed)
- `assigned_to` (text - who's working on it)
- `notes` (text - your notes)
- `email_draft_created` (boolean)

**STATUS:** Awaiting user confirmation before finalizing deletion list

---

## 🔧 WORKFLOW CHANGES NEEDED

### 1. Extract and Transform Node
Update field mappings to match new schema:
```javascript
const transformed = {
  // Core identification
  hcp_number: json.hcpnumber || '',
  clinic_name: json.hcpname || '',
  application_number: json.applicationnumber || '',
  funding_year: json.funding_year || json.fundingyear || '',
  application_type: json.application_type || json.applicationtype || '',

  // Address
  address: json.healthcaresite_addressline1 || '',
  city: json.healthcaresite_city || '',
  state: json.healthcaresite_state || '',
  zip: json.healthcaresite_zipcode || '',

  // Contact info
  contact_name: `${json.contact_firstname || ''} ${json.contact_lastname || ''}`.trim(),
  contact_phone: json.contact_phonenumber || '',
  contact_email: json.contact_email || '',

  // Mail contact
  mail_contact_first_name: json.mailcontact_firstname || '',
  mail_contact_last_name: json.mailcontact_lastname || '',
  mail_contact_org_name: json.mailcontact_orgname || '',
  mail_contact_phone: json.mailcontact_phone || '',
  mail_contact_email: json.mailcontact_email || '',

  // Service details
  allowable_contract_start_date: json.allowablecontractstartdate || null,
  contract_length: json.requestedcontractperiod ? parseInt(json.requestedcontractperiod) : null,
  service_type: json.descriptionofservicesrequested || '',
  form_465_pdf_url: json.linktofccformpdf || json.link_to_pdf || '',

  // Document links (JSONB)
  additional_documents: collectDocumentLinks(json),

  // Deduplication hash
  form_465_hash: createHash(json),
  filing_date: json.posting_date || new Date().toISOString(),

  // Tracking defaults
  processed: false
};
```

### 2. Merge Historical Funding Node
Simplified to just collect funding amounts:
```javascript
// Collect historical funding data
const historicalFunding = [];
for (const item of historicalData) {
  const json = item.json;
  if (json.funding_year && json.original_requested_amount) {
    historicalFunding.push({
      year: json.funding_year,
      amount: parseFloat(json.original_requested_amount) || 0
    });
  }
}

// Merge with clinic data
const enrichedRecord = {
  ...clinicData,
  historical_funding: historicalFunding
};

return [{ json: enrichedRecord }];
```

**DELETE:** All priority scoring logic (premature)

---

## 📝 EXACT NEXT STEPS (When You Resume)

### Step 1: Finalize Schema Decisions (2 min)
**User to decide:**
- Keep `processed`, `assigned_to`, `notes`, `email_draft_created` fields? (Y/N)

### Step 2: Run Schema Migration (5 min)
1. Create migration SQL file: `schema_cleanup_v4.sql`
2. Add missing columns (11 new fields)
3. Delete bloat columns (based on user decision)
4. Run in Supabase SQL Editor
5. Verify with test query

### Step 3: Update Workflow (10 min)
1. Update "Extract and Transform Filing Data" node with correct field mappings
2. Simplify "Merge Historical Funding" node (remove priority logic)
3. Test with Execute Workflow
4. Verify data in Supabase

### Step 4: Test End-to-End (5 min)
1. Run workflow with real USAC data
2. Verify all fields populate correctly
3. Check historical_funding JSONB format
4. Confirm no PGRST204 errors

---

## 📁 FILES REFERENCE

### Created This Session:
- `workflows/phase1_clean_workflow.json` - Clean 6-node workflow (has bugs)
- `workflows/phase1_clean_workflow_CORRECTED.json` - Fixed loop + endpoint
- `workflows/PHASE1_WORKFLOW_SUMMARY.md` - Workflow documentation
- `workflows/PHASE1_FIXES_APPLIED.md` - Loop fix documentation
- `database/schema_update_v3_alignment_fix.sql` - Previous migration (4 columns)

### Need to Create Next:
- `database/schema_cleanup_v4.sql` - Add 11 fields + delete bloat
- `workflows/phase1_workflow_FINAL.json` - Updated with correct fields
- `workflows/FIELD_MAPPINGS_FINAL.md` - Complete field mapping guide

---

## 🐛 KNOWN ISSUES

1. **PGRST204 Error:** `funding_year` column missing - **WILL BE FIXED** in schema_cleanup_v4.sql
2. **Loop Connections:** Backwards in original workflow - **FIXED** in CORRECTED.json
3. **Historical Endpoint:** Was placeholder - **FIXED** (2kme-evqq.json)
4. **Priority Logic:** Unnecessary complexity - **WILL BE REMOVED** in next workflow update

---

## 💡 KEY INSIGHTS

1. **Keep it simple:** Store exactly what USAC provides, nothing more
2. **JSONB for flexibility:** Both `additional_documents` and `historical_funding` use JSONB for future-proofing
3. **Dynamic year queries:** Workflow calculates "last 3 years" automatically - no hardcoding
4. **One table design:** Everything in `clinics_pending_review` - no need for separate historical table

---

## 🎬 TO RESUME SESSION

**Say to Claude:**
> "Resume from CHECKPOINT_2025-11-09_SCHEMA_CLEANUP.md. I want to keep the fields: [processed/assigned_to/notes/email_draft_created - YES or NO]. Let's create the schema migration and update the workflow."

**Claude will:**
1. Read this checkpoint file
2. Create `schema_cleanup_v4.sql` based on your field decision
3. Update the workflow with correct field mappings
4. Guide you through testing

---

## ⏱️ ESTIMATED TIME TO COMPLETE

- Schema migration: 5 minutes
- Workflow update: 10 minutes
- Testing: 5 minutes
- **TOTAL:** ~20 minutes to fully working Phase 1

---

**CHECKPOINT SAVED** ✅

You can now exit and restart. All context preserved in this document.
