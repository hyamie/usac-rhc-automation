# USAC RHC Automation - Complete Handoff Document

**Date:** November 7, 2025
**Session Duration:** ~3 hours
**Status:** Active debugging - Supabase insert issue
**Priority:** HIGH - Data flows correctly but doesn't persist to database

---

## 🎯 IMMEDIATE PROBLEM (Start Here)

### The Issue
Main Daily Workflow V2 executes successfully with all green checkmarks, processes 2 clinics from USAC API, merges with historical funding data correctly, BUT **no data appears in Supabase database** (only shows original test clinic).

### What We Know Works
- ✅ USAC API fetch: Returns 2 clinics
- ✅ Data processing: Extracts all fields correctly
- ✅ Loop Over Items: Processes each clinic individually
- ✅ Historical funding query: Gets 3 years of data
- ✅ Calculate & Merge: Outputs correct merged data with funding amounts
- ✅ Insert node shows "Run 1 of 2" and "Run 2 of 2" - appears to execute

### What Doesn't Work
- ❌ Data not appearing in Supabase `clinics_pending_review` table
- ❌ Only "test clinic" visible in database

### Most Likely Causes (In Order)
1. **Row Level Security (RLS)** blocking service role inserts
2. **Wrong Supabase credentials** (using anon key instead of service role)
3. **Field name mismatch** between workflow output and database schema
4. **Silent API error** not being displayed in n8n output

### Immediate Next Steps
1. Click "Insert into Supabase" node in execution → Check OUTPUT tab for errors
2. Check HTTP status code (should be 201 Created for successful insert)
3. Go to Supabase → Authentication → Policies → Check `clinics_pending_review` RLS
4. If RLS is enabled, temporarily disable it for testing
5. Verify n8n is using "Supabase Service Role" credential (not anon key)

---

## 📊 PROJECT OVERVIEW

### What This System Does
Automated pipeline for USAC RHC Form 465 filings:
1. **Daily Monitor:** Fetches new Form 465 filings from USAC Open Data API
2. **Data Enrichment:** Detects consultants, queries historical funding, enriches contact info
3. **Email Generation:** Uses Claude AI to generate personalized outreach emails
4. **Dashboard:** Next.js app to review/manage leads

### Tech Stack
- **Automation:** n8n Cloud (https://hyamie.app.n8n.cloud)
- **Database:** Supabase PostgreSQL (https://fhuqiicgmfpnmficopqp.supabase.co)
- **Dashboard:** Next.js 14 + Vercel (not yet deployed)
- **AI:** Claude Sonnet 4.5 via Anthropic API
- **Email:** Microsoft Outlook API
- **Data Source:** USAC Open Data API (dataset sm8n-gg82)

### Current Phase
**Phase 2:** Consultant detection + historical funding tracking
- Completed: Database schema, workflow design, dashboard components
- In Progress: Main workflow debugging (insert issue)
- Not Started: Enrichment workflow testing, dashboard deployment

---

## 🗂️ FILE STRUCTURE

### Project Location
```
C:\ClaudeAgents\projects\usac-rhc-automation\
├── .git/
├── database/
│   ├── schema.sql (original v1)
│   ├── schema_update_v2.sql (Phase 2 additions)
│   ├── SETUP.md
│   └── DEPLOY_INSTRUCTIONS.md
├── workflows/
│   ├── 01-main-daily-workflow.json (v1 - old)
│   ├── 01-main-daily-workflow-v2.json (Phase 2 - has env fix, NO loop fix)
│   ├── 02-enrichment-sub-workflow.json (v1 - old)
│   ├── 02-enrichment-sub-workflow-v2.json (Phase 2 - fixed today)
│   ├── 03-rule-monitor-workflow.json
│   └── SETUP.md
├── dashboard/
│   ├── src/
│   ├── package.json
│   ├── .env.local (has Supabase credentials)
│   └── README.md
├── docs/
│   ├── 01-architecture.md
│   ├── 02-database-schema.md
│   ├── 03-n8n-workflows.md
│   └── 04-dashboard-design.md
├── .gitignore
├── README.md
├── PROGRESS.md
├── DEPLOYMENT_STATUS.md
├── PHASE2_COMPLETE.md
├── ENRICHMENT_WORKFLOW_FIX.md (created today)
├── SESSION_RESUME_2025-11-07.md (created today)
└── COMPLETE_HANDOFF_2025-11-07.md (this file)
```

---

## 🔧 WHAT WE FIXED TODAY

### 1. Enrichment Workflow Issues (COMPLETED ✅)

#### Problem 1: Image Size Error
**Error:** `API Error 400: At least one of the image dimensions exceed max allowed size for many-image requests: 2000 pixels`

**Root Cause:** Google Search API returns images embedded in results, which were being passed to Claude API node, exceeding 2000px limit.

**Fix Applied:**
- Modified "Extract Enrichment Findings" node to strip all binary/image data
- Only text fields (strings, numbers, booleans) passed to Claude
- File: `workflows/02-enrichment-sub-workflow-v2.json`
- Git commit: 82df4ea

**Code Change:**
```javascript
// Extract enrichment findings from search results (TEXT ONLY - strip images)
const inputData = $input.first().json;
const clinic = {};

// Copy only primitive/text fields from clinic data (no images/binary)
for (const key in inputData) {
  const value = inputData[key];
  if (typeof value === 'string' || typeof value === 'number' ||
      typeof value === 'boolean' || value === null || value === undefined) {
    clinic[key] = value;
  }
}

// Only extract text snippet - ignore images, pagemap, etc.
if (inputData.items && Array.isArray(inputData.items) && inputData.items.length > 0) {
  const topResult = inputData.items[0];
  enrichmentFinding = topResult.snippet || '';
  // ... rest of logic
}
```

#### Problem 2: Unnecessary Hunter.io Node
**Issue:** Hunter.io domain search node was executing but results never used in subsequent nodes, costing API credits and adding latency.

**Fix Applied:**
- Removed entire Hunter.io node from workflow
- Connected "Determine Contact Type" directly to "Google Search"
- File: `workflows/02-enrichment-sub-workflow-v2.json`
- Git commit: ec6c4da

**Benefits:**
- No more Hunter.io API costs per enrichment
- Faster workflow execution (one less HTTP request)
- Cleaner workflow design

#### Problem 3: n8n Cloud Environment Variable Access
**Error:** `access to env vars denied - N8N_BLOCK_ENV_ACCESS_IN_NODE`

**Root Cause:** n8n Cloud blocks `$env` variable access for security. Workflow used `={{$env.SUPABASE_URL}}` which failed.

**Fix Applied:**
- Replaced all `={{$env.SUPABASE_URL}}` with hardcoded URL
- URL: `https://fhuqiicgmfpnmficopqp.supabase.co`
- Fixed in both V2 workflows
- Files: `workflows/01-main-daily-workflow-v2.json`, `workflows/02-enrichment-sub-workflow-v2.json`
- Git commit: 8ce329c

### 2. Main Daily Workflow Issues (IN PROGRESS ⚠️)

#### Problem 1: Multiple Clinics Not Processing Correctly
**Issue:** Workflow designed for deduplication (1 clinic at a time), but deduplication nodes were removed. When 2+ clinics returned, only 1 processed through historical funding, resulting in data merge errors.

**Diagnosis:**
- "Process & Extract All Fields" outputs 2 clinics
- "Query Historical Funding" expected 1 clinic, got 2
- "Calculate Priority & Merge" code assumed: Item 1 = clinic, Items 2+ = funding records
- With 2 clinics: Item 1 = Clinic A, Item 2 = Clinic B (treated as funding!), Items 3-5 = actual funding
- Result: Empty data inserted to Supabase

**Fix Applied (in n8n only, NOT committed to Git):**
- Added "Loop Over Items" node between "Process & Extract All Fields" and "Query Historical Funding"
- Processes each clinic individually through funding query and merge
- Updated "Calculate Priority & Merge Data" code to work with loop structure

**Current Workflow Structure (in n8n):**
```
Schedule Trigger - Daily 7 AM
  ↓
Fetch Form 465 Filings (USAC API) [2 items]
  ↓
Process & Extract All Fields [2 items]
  ↓
Loop Over Items (input: 2 clinics)
  ↓ "loop" output (one clinic at a time)
  Query Historical Funding (3 Years) [3 funding records]
  ↓
  Calculate Priority & Merge Data [1 merged clinic with funding]
  ↓
  Insert into Supabase [??? shows success but no data in DB]
  ↓ (back to Loop Over Items input to process next clinic)

Loop Over Items "done" output (after all processed)
  ↓
Log Completion
```

**Updated "Calculate Priority & Merge Data" Code:**
```javascript
// Simple merge: Just add funding data to clinic record
const allInputs = $input.all();

// First item is the clinic, rest are funding records
const filing = allInputs[0].json;
const historicalData = allInputs.slice(1);

// Add funding data if available
if (historicalData.length > 0) {
  historicalData.forEach((record, index) => {
    const data = record.json;
    if (index < 3) {
      filing[`funding_year_${index + 1}`] = parseInt(data.funding_year) || null;
      filing[`funding_amount_${index + 1}`] = parseFloat(data.original_requested_amount) || 0;
    }
  });

  // Calculate total
  filing.total_funding_3y = (filing.funding_amount_1 || 0) +
                            (filing.funding_amount_2 || 0) +
                            (filing.funding_amount_3 || 0);
} else {
  // No funding data
  filing.total_funding_3y = 0;
}

return { json: filing };
```

**Status:**
- ✅ Loop Over Items added and connected
- ✅ Code updated and working (outputs correct merged data)
- ❌ NOT committed to Git (only exists in n8n)
- ❌ Insert to Supabase not working (current problem)

#### Problem 2: Insert into Supabase Not Persisting Data (CURRENT BLOCKER)
**Issue:** Insert node shows successful execution (Run 1 of 2, Run 2 of 2), but no data appears in Supabase database.

**What We Know:**
- Calculate & Merge outputs correct data (verified in execution)
- Insert node receives correct data (verified in INPUT)
- Insert node shows 2 runs (both clinics processed)
- Supabase still only shows test clinic

**What We DON'T Know:**
- Insert node OUTPUT (not checked yet)
- HTTP status code from Supabase API
- Whether RLS is blocking inserts
- If credentials are correct (service role vs anon key)

**Next Steps:** See "DEBUGGING INSTRUCTIONS" section below

---

## 📋 LATEST TEST EXECUTION RESULTS

### Test Run: 2025-11-07 ~4:50 PM

#### 1. Fetch Form 465 Filings (USAC API)
**Output:** 2 items

**Clinic 1:**
- HCP Number: 50472
- Application: RHC46500001741
- Clinic: Honesdale Family Health Center
- Location: Honesdale, PA
- Contact Email: (empty)
- Mail Contact: wwalker@communityhospitalcorp.com
- Consultant: TRUE (domain mismatch)

**Clinic 2:**
- HCP Number: 114200
- Application: RHC46500001746
- Clinic: PCHD - Therapy Services
- Location: American Falls, ID
- Contact Email: (empty)
- Mail Contact: wwalker@communityhospitalcorp.com
- Consultant: TRUE (domain mismatch)

#### 2. Process & Extract All Fields
**Output:** 2 items

Both clinics processed with:
- `is_consultant: true`
- `consultant_email_domain: communityhospitalcorp.com`
- `consultant_detection_method: auto_domain`
- `program_type: Telecom`
- `form_465_pdf_url: https://rhc.usac.org/rhc/public/viewPdf.seam?documentId=[app_number]`
- `created_at: 2025-11-07T16:52:32.966Z`

#### 3. Loop Over Items
**Input:** 2 items
**Processing:** One at a time via "loop" output

#### 4. Query Historical Funding (3 Years)
**For HCP 50472 (shown in execution):**
- 2025: $1102.08
- 2024: $1016.88
- 2023: $469.44

**Output:** 3 items

#### 5. Calculate Priority & Merge Data
**Input:** 4 items (1 clinic + 3 funding records)

**Output (verified working):**
```json
{
  "hcp_number": "114200",
  "application_number": "RHC46500001746",
  "form_465_hash": "2dd38aa6c3cb20973312f99a83fcf740dfe23e58ff8778149f4cfeff945a6fd0",
  "city": "AMERICAN FALLS",
  "state": "ID",
  "contact_email": "empty",
  "mail_contact_email": "wwalker@communityhospitalcorp.com",
  "is_consultant": true,
  "consultant_email_domain": "communityhospitalcorp.com",
  "consultant_detection_method": "auto_domain",
  "program_type": "Telecom",
  "funding_year_1": 2024,
  "funding_amount_1": 1016.88,
  "funding_year_2": 2023,
  "funding_amount_2": 469.44,
  "funding_year_3": null,
  "funding_amount_3": 0,
  "total_funding_3y": 1486.32,
  "form_465_pdf_url": "https://rhc.usac.org/rhc/public/viewPdf.seam?documentId=RHC46500001746",
  "processed": false,
  "created_at": "2025-11-07T16:52:32.966Z"
}
```

**Status:** ✅ Data merge working correctly

#### 6. Insert into Supabase
**Shows:** Run 2 of 2 (both clinics processed)
**INPUT:** Correct merged data (verified)
**OUTPUT:** NOT CHECKED YET ⚠️
**Result:** No data in Supabase database ❌

---

## 🗄️ DATABASE INFORMATION

### Supabase Project
- **URL:** https://fhuqiicgmfpnmficopqp.supabase.co
- **Region:** (check in Supabase dashboard)
- **Anon Key:** In `dashboard/.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service Role Key:** In `dashboard/.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

### Table: clinics_pending_review

**Schema (Phase 2 - with all updates):**

```sql
CREATE TABLE clinics_pending_review (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Core identifiers
  hcp_number TEXT,
  application_number TEXT UNIQUE,
  form_465_hash TEXT UNIQUE,

  -- Clinic information
  clinic_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,

  -- Contact information
  contact_name TEXT,
  contact_title TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Mail contact (potentially consultant)
  mail_contact_name TEXT,
  mail_contact_email TEXT,
  mail_contact_company TEXT,

  -- Consultant detection (Phase 2)
  is_consultant BOOLEAN DEFAULT false,
  consultant_company TEXT,
  consultant_email_domain TEXT,
  consultant_detection_method TEXT, -- 'auto_domain', 'auto_employer', 'manual_tagged', 'manual_untagged'

  -- Historical funding (Phase 2)
  funding_year_1 INTEGER,
  funding_amount_1 NUMERIC(12,2),
  funding_year_2 INTEGER,
  funding_amount_2 NUMERIC(12,2),
  funding_year_3 INTEGER,
  funding_amount_3 NUMERIC(12,2),
  total_funding_3y NUMERIC(12,2),

  -- Dates
  posting_date DATE,
  filing_date DATE,
  allowable_contract_start_date DATE,

  -- Program information (Phase 2)
  program_type TEXT, -- 'Telecom' or 'Healthcare Connect'
  service_type TEXT,
  description_of_services TEXT,

  -- Contract details
  contract_length INTEGER,
  bandwidth TEXT,

  -- PDF and metadata (Phase 2)
  form_465_pdf_url TEXT,

  -- Enrichment data
  enriched BOOLEAN DEFAULT false,
  enrichment_date TIMESTAMP,
  enrichment_finding TEXT,
  linkedin_url TEXT,

  -- Email tracking
  email_draft_created BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  email_subject TEXT,
  email_body TEXT,

  -- Workflow status
  review_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'contacted'
  priority_score INTEGER,
  priority_label TEXT, -- 'High', 'Medium', 'Low'
  processed BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  last_updated TIMESTAMP DEFAULT now()
);
```

**Current Data:**
- Only 1 record: "test clinic" (manually inserted earlier)
- Expected: 2+ records after workflow runs

**Indexes:**
```sql
CREATE INDEX idx_clinics_hcp_number ON clinics_pending_review(hcp_number);
CREATE INDEX idx_clinics_review_status ON clinics_pending_review(review_status);
CREATE INDEX idx_clinics_priority ON clinics_pending_review(priority_score DESC);
CREATE INDEX idx_clinics_posting_date ON clinics_pending_review(posting_date DESC);
```

**Row Level Security (RLS):**
- **Status:** UNKNOWN - NEED TO CHECK ⚠️
- If enabled, may be blocking service role inserts
- **Action:** Go to Supabase → Authentication → Policies → Check `clinics_pending_review`

---

## 🔑 CREDENTIALS & CONFIGURATION

### n8n Credentials (in n8n Cloud)

**1. USAC API Key (httpHeaderAuth)**
- **Credential ID:** 1
- **Name:** "USAC API Key"
- **Type:** HTTP Header Auth
- **Header Name:** X-App-Token
- **Header Value:** `11dn8902oi2mirzchn1huum05`
- **Used In:** Main Daily Workflow, Query Historical Funding nodes

**2. Supabase Service Role (httpHeaderAuth)**
- **Credential ID:** 2
- **Name:** "Supabase Service Role"
- **Type:** HTTP Header Auth
- **Header Name:** apikey
- **Header Value:** Service role key from `.env.local`
- **Additional Headers:**
  - Authorization: Bearer [same service role key]
- **Used In:** All Supabase INSERT/UPDATE/SELECT nodes

**3. Hunter.io API Key** (REMOVED - no longer used)

**4. Google API Key (httpQueryAuth)**
- **Credential ID:** 7
- **Name:** "Google API Key"
- **Type:** HTTP Query Auth
- **Used In:** Enrichment workflow Google Search node

**5. Anthropic API Key**
- **Credential ID:** 5
- **Name:** "Anthropic API Key"
- **Used In:** Enrichment workflow Claude email generation node

**6. Microsoft Outlook OAuth**
- **Credential ID:** 6
- **Name:** "Microsoft Outlook OAuth"
- **Used In:** Enrichment workflow Outlook draft creation

### Environment Variables

**n8n (blocked from workflow access):**
- Cannot use `$env.SUPABASE_URL` or other env vars
- All URLs must be hardcoded in workflows

**Dashboard (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=https://fhuqiicgmfpnmficopqp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
SUPABASE_SERVICE_ROLE_KEY=[service_role_key]
N8N_ENRICHMENT_WEBHOOK_URL=[to be added after workflow active]
N8N_WEBHOOK_TOKEN=[to be added]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🐛 DEBUGGING INSTRUCTIONS

### Step-by-Step: Fix Supabase Insert Issue

#### Phase 1: Check Insert Node Output (5 minutes)

1. **Open n8n:** https://hyamie.app.n8n.cloud
2. **Open workflow:** "USAC RHC - Main Daily Workflow V2 (Phase 2)"
3. **Find last execution** in Executions panel
4. **Click on "Insert into Supabase" node**
5. **Switch to OUTPUT tab**

**Check for:**
- HTTP status code (look for 201 Created, 200 OK, or 4xx/5xx errors)
- Response body - any error messages?
- Does it say "Prefer: return=minimal" (means no response body returned)

**Possible Outcomes:**

**A) Status 201 Created + No error:**
- Data IS being inserted
- Problem: Maybe inserted to wrong table or with wrong data
- Action: Check Supabase directly, look for records with recent timestamps

**B) Status 403 Forbidden:**
- Row Level Security is blocking
- Action: Go to Phase 2

**C) Status 401 Unauthorized:**
- Wrong credentials (using anon key instead of service role)
- Action: Go to Phase 3

**D) Status 400 Bad Request:**
- Field validation error or schema mismatch
- Action: Go to Phase 4

**E) Status 422 Unprocessable Entity:**
- Database constraint violation (unique key, foreign key, etc.)
- Action: Check if `form_465_hash` or `application_number` already exists in DB

#### Phase 2: Check Row Level Security (10 minutes)

1. **Go to Supabase:** https://fhuqiicgmfpnmficopqp.supabase.co
2. **Navigate:** Authentication → Policies
3. **Find table:** `clinics_pending_review`
4. **Check status:**
   - Is RLS enabled? (toggle at top)
   - Are there INSERT policies?
   - Do policies allow service role?

**If RLS is enabled:**

**Quick Fix (for testing):**
```sql
-- Temporarily disable RLS
ALTER TABLE clinics_pending_review DISABLE ROW LEVEL SECURITY;
```

**Proper Fix (keep RLS, allow service role):**
```sql
-- Allow service role to insert
CREATE POLICY "Service role can insert"
ON clinics_pending_review
FOR INSERT
TO service_role
USING (true);

-- Allow service role to select
CREATE POLICY "Service role can select"
ON clinics_pending_review
FOR SELECT
TO service_role
USING (true);
```

**After applying policy:**
- Run workflow again
- Check if data appears

#### Phase 3: Verify Credentials (5 minutes)

1. **In n8n workflow, click "Insert into Supabase" node**
2. **Check Parameters:**
   - URL should be: `https://fhuqiicgmfpnmficopqp.supabase.co/rest/v1/clinics_pending_review`
   - Method: POST
   - Authentication: Generic Credential Type → HTTP Header Auth
   - **Credential dropdown:** Should say "Supabase Service Role" (ID: 2)

**If using wrong credential:**
- Click credential dropdown
- Select "Supabase Service Role"
- Save workflow
- Test again

**Verify credential configuration:**
- Click "Supabase Service Role" credential → Edit
- Header Name: `apikey`
- Header Value: Should match service role key from `.env.local`
- Additional Headers:
  - Name: `Authorization`
  - Value: `Bearer [same service role key]`

#### Phase 4: Check Field Mapping (10 minutes)

1. **Compare workflow output with database schema:**
   - Click "Calculate Priority & Merge Data" → OUTPUT tab
   - List all fields being sent

2. **Check database schema:**
   - Go to Supabase → Table Editor → `clinics_pending_review`
   - Click "Edit table definition"
   - Compare field names and types

**Common mismatches:**
- Field name case sensitivity (PostgreSQL is case-sensitive in quotes)
- Missing required fields
- Wrong data types (string vs number)
- NULL values in NOT NULL columns

**Fix field mismatches:**
- Update "Calculate Priority & Merge Data" code to match exact field names
- Ensure all required fields have values
- Convert data types as needed

#### Phase 5: Test Manual Insert (5 minutes)

**Verify table works by manual insert:**

1. **Go to Supabase → SQL Editor**
2. **Run this test insert:**

```sql
INSERT INTO clinics_pending_review (
  hcp_number,
  application_number,
  form_465_hash,
  clinic_name,
  city,
  state,
  is_consultant,
  program_type,
  created_at
) VALUES (
  'TEST123',
  'TEST_APP_456',
  'test_hash_' || now()::text,
  'Test Clinic Manual',
  'Test City',
  'TX',
  false,
  'Telecom',
  now()
);
```

3. **Check Table Editor** - does the record appear?

**If YES:**
- Database works fine, issue is in n8n configuration
- Revisit Phase 1-3

**If NO:**
- Database permissions issue
- Check if you're using the service role key in SQL Editor
- Check RLS policies

#### Phase 6: Add Debugging Headers (5 minutes)

**Make Insert node return full response:**

1. **Edit "Insert into Supabase" node**
2. **Go to Options → Headers → Add header:**
   - Name: `Prefer`
   - Value: `return=representation`
3. **Save and test**

**This will:**
- Return the inserted record in the response
- Show exactly what was inserted
- Reveal any data transformation issues

---

## 📝 GIT STATUS

### Current Branch
**master** (up to date with origin)

### Last Commit
**8ea1911** - "Add session resume document for debugging checkpoint"
- Date: 2025-11-07 Evening
- Author: Claude Code

### Commit History (Today)
1. **82df4ea** - Fix enrichment workflow image size error
2. **ec6c4da** - Remove unnecessary Hunter.io node
3. **8ce329c** - Fix n8n Cloud env variable access error
4. **3fc4a67** - Update fix documentation with env variable issue
5. **8ea1911** - Add session resume document

### Files NOT in Git (Only in n8n)
⚠️ **CRITICAL:** Main Daily Workflow changes with Loop Over Items NOT committed

**What's different:**
- Loop Over Items node added
- Connections rerouted through loop
- Calculate Priority & Merge Data code updated

**Why not committed:**
- Waiting for Insert issue to be fixed
- Don't want to commit non-working version
- Once working, need to export from n8n and commit

**Action after fixing:**
1. Test workflow end-to-end
2. Export workflow JSON from n8n
3. Save to `workflows/01-main-daily-workflow-v2.json`
4. Commit with message: "Add Loop Over Items to process multiple clinics"

### Files Ready to Commit (Staged)
- None currently

### Untracked Files
- `ANTHROPIC_API_KEY.md` (in .gitignore)

---

## 🧪 TESTING CHECKLIST

### When Insert Issue is Fixed

#### Test 1: Manual Workflow Execution
- [ ] Open n8n Main Daily Workflow V2
- [ ] Click "Execute workflow"
- [ ] Verify all nodes green
- [ ] Check Supabase - see 2 new clinics?
- [ ] Verify funding amounts populated
- [ ] Check consultant detection flags

#### Test 2: Data Validation
- [ ] In Supabase Table Editor, check new records:
  - [ ] `hcp_number` matches USAC data
  - [ ] `application_number` unique and correct
  - [ ] `is_consultant` = true for both clinics
  - [ ] `consultant_email_domain` = "communityhospitalcorp.com"
  - [ ] `funding_year_1`, `funding_amount_1` populated
  - [ ] `total_funding_3y` calculated correctly
  - [ ] `form_465_pdf_url` valid and accessible
  - [ ] `created_at` timestamp recent

#### Test 3: Deduplication (Run Twice)
- [ ] Run workflow again immediately
- [ ] Should not insert duplicates (check `form_465_hash` unique constraint)
- [ ] Workflow should handle gracefully (no crashes)

#### Test 4: Scheduled Trigger
- [ ] Change schedule to "next minute" for testing
- [ ] Wait for auto-execution
- [ ] Check execution history
- [ ] Verify automatic run worked

#### Test 5: Enrichment Workflow
**After Main workflow working:**
- [ ] Import fixed enrichment workflow: `workflows/02-enrichment-sub-workflow-v2.json`
- [ ] Set up all credentials (Supabase, Google, Anthropic, Outlook)
- [ ] Get a clinic ID from Supabase
- [ ] Test webhook with: `POST /webhook/enrichment-v2` with body `{"clinic_id": "uuid"}`
- [ ] Check Outlook for draft email
- [ ] Verify Supabase updated with enrichment data

---

## 📞 IMPORTANT URLS & CONTACTS

### Services
- **n8n Cloud:** https://hyamie.app.n8n.cloud
- **Supabase Dashboard:** https://fhuqiicgmfpnmficopqp.supabase.co
- **USAC Open Data Portal:** https://opendata.usac.org
- **USAC Dataset (sm8n-gg82):** https://opendata.usac.org/resource/sm8n-gg82.json
- **GitHub Repo:** https://github.com/hyamie/usac-rhc-automation

### Documentation
- **Supabase Docs:** https://supabase.com/docs
- **n8n Docs:** https://docs.n8n.io
- **USAC API Docs:** Referenced in `USAC_API_CREDENTIALS.md`

### Local Files
- **Project Root:** `C:\ClaudeAgents\projects\usac-rhc-automation`
- **Config:** `C:\ClaudeAgents\config\.env`
- **Credentials Doc:** `USAC_API_CREDENTIALS.md`

---

## 🎬 HOW TO RESUME THIS SESSION

### Paste This to Resume:

```
Resuming USAC RHC Automation project from C:\ClaudeAgents\projects\usac-rhc-automation

CURRENT BLOCKER:
Main Daily Workflow V2 executes successfully, processes 2 clinics, merges with
historical funding correctly, but data doesn't appear in Supabase database.
Insert node shows "Run 1 of 2" and "Run 2 of 2" but only test clinic visible in DB.

STATUS:
- Enrichment workflow fixed (image error, Hunter.io removed, env vars) ✅
- Main workflow Loop Over Items added ✅
- Calculate & Merge outputs correct data ✅
- Insert to Supabase not persisting data ❌

NEXT STEP:
Check "Insert into Supabase" node OUTPUT for error messages and HTTP status code.
Most likely causes: RLS blocking inserts, wrong credentials, or field mismatch.

See COMPLETE_HANDOFF_2025-11-07.md for full debugging instructions.
```

---

## 🔮 AFTER THIS IS FIXED

### Immediate Next Steps (1-2 hours)
1. ✅ Fix Insert to Supabase issue
2. Export working workflow from n8n
3. Commit to Git: `01-main-daily-workflow-v2.json` (with Loop Over Items)
4. Test enrichment workflow in n8n
5. Run end-to-end test: Main workflow → Supabase → Enrichment → Outlook
6. Deploy Phase 2 database schema update to Supabase (if not done already)

### Short-term Goals (1 week)
1. Activate daily schedule on Main workflow
2. Set up webhook URLs for enrichment
3. Build dashboard pages to display clinics
4. Deploy dashboard to Vercel
5. Test full pipeline: auto-fetch → enrich → email → review

### Medium-term Goals (1 month)
1. Monitor daily executions
2. Refine consultant detection accuracy
3. Add more enrichment sources
4. Build email tracking/analytics
5. Add manual override features in dashboard

---

## 🧠 KEY LEARNINGS & GOTCHAS

### n8n Cloud Specific
1. **Cannot use $env variables** - must hardcode URLs and sensitive values in credentials
2. **Loop Over Items required** for processing arrays individually through HTTP nodes
3. **continueOnFail: true** recommended for optional enrichment steps
4. **Prefer: return=minimal** header means no response body (use return=representation for debugging)

### USAC API
1. **Field names change** between API versions - verify actual response structure
2. **Date filter format:** `yyyy-MM-dd` format required
3. **posting_date vs allowable_contract_start_date** - use posting_date for new filings
4. **original_requested_amount** for funding (not total_approved_one_time_cost)

### Supabase
1. **RLS can block service role** if policies not configured correctly
2. **Unique constraints** on form_465_hash and application_number prevent duplicates
3. **Service role key ≠ anon key** - must use correct one for inserts
4. **Case sensitivity** in PostgreSQL - field names matter

### Workflow Design
1. **Process one item at a time** through stateful operations (API calls with item-specific data)
2. **Strip binary data** before sending to AI APIs
3. **Deduplication** best done in database, not workflow (use unique constraints)
4. **Priority scoring** can be calculated in dashboard, not required in workflow

---

## ❓ COMMON QUESTIONS & ANSWERS

**Q: Why is only the enrichment workflow committed, not the main workflow?**
A: The main workflow changes (Loop Over Items) are only in n8n, not yet exported to JSON. Waiting for Insert issue to be fixed before committing working version.

**Q: Where are the Supabase credentials stored?**
A: In `dashboard/.env.local` (not committed to Git). Service role key is configured as n8n credential "Supabase Service Role" (ID: 2).

**Q: Can I test the workflows without activating the schedule?**
A: Yes! Use "Execute workflow" button in n8n for manual testing. Only activate schedule when ready for production.

**Q: What's the difference between v1 and v2 workflows?**
A: V2 includes Phase 2 features: consultant detection, historical funding (3 years), additional metadata fields, and program type filtering.

**Q: Why remove priority scoring?**
A: User decided to display raw funding amounts in dashboard instead of calculated score. Simpler and more transparent.

**Q: Do I need to run database schema updates?**
A: Check Supabase Table Editor for `clinics_pending_review` - if it has consultant fields (is_consultant, consultant_company, etc.) and funding fields (funding_year_1, etc.), schema is already updated. If not, run `database/schema_update_v2.sql`.

**Q: What happens if USAC API returns 0 new filings?**
A: Workflow completes successfully with 0 inserts. This is normal - not every day has new filings.

**Q: How do I get the enrichment webhook URL?**
A: After importing enrichment workflow to n8n, click the Webhook Trigger node → copy the Production URL → add to dashboard `.env.local` as N8N_ENRICHMENT_WEBHOOK_URL.

---

## 📊 EXPECTED VS ACTUAL STATE

### Expected (After All Fixes)
- Main workflow runs daily at 7 AM
- Fetches new Form 465 filings from USAC
- Inserts 0-10 new clinics per day to Supabase
- Consultant detection flags 30-50% as consultants
- Historical funding populated for 80%+ of clinics
- Dashboard shows all clinics with filters
- Enrichment can be triggered per clinic
- Emails generated and saved as Outlook drafts

### Actual (Current State)
- ✅ Main workflow structure complete
- ✅ Data processing working
- ✅ Consultant detection working
- ✅ Historical funding query working
- ✅ Data merge working
- ❌ Insert to Supabase not persisting
- ❌ Dashboard not deployed
- ⚠️ Enrichment workflow fixed but not tested

---

## 🚨 CRITICAL REMINDERS

1. **DO NOT commit broken workflows to Git** - test thoroughly first
2. **DO NOT activate schedule until Insert is working** - will just spam errors
3. **DO NOT push credentials or API keys to Git** - use .gitignore
4. **DO NOT delete test clinic from Supabase** - needed for baseline testing
5. **DO export working workflow from n8n before making major changes** - backup!

---

## 📁 BACKUP & RECOVERY

### How to Recover if Something Breaks

**Workflow broke in n8n:**
1. Import last known good version from Git: `workflows/01-main-daily-workflow-v2.json`
2. Re-apply Loop Over Items changes (see "Current Workflow Structure" section)
3. Update Calculate & Merge code (see code snippet above)

**Database schema issue:**
1. Go to Supabase → SQL Editor
2. Run `database/schema.sql` (creates clean v1 schema)
3. Run `database/schema_update_v2.sql` (adds Phase 2 fields)

**Git repository issue:**
1. All changes committed and pushed to GitHub
2. Clone fresh: `git clone https://github.com/hyamie/usac-rhc-automation.git`

**Lost credentials:**
1. Supabase: Dashboard → Project Settings → API
2. USAC: See `USAC_API_CREDENTIALS.md`
3. n8n: Credentials panel → Re-create credentials

---

**END OF HANDOFF DOCUMENT**

**Total Time to Fix Insert Issue (Estimate):** 15-30 minutes
**Total Time to Complete Phase 2:** 1-2 hours
**Priority:** HIGH - blocking all downstream work

Good luck! 🚀

---

**Document Version:** 1.0
**Created:** 2025-11-07
**Last Updated:** 2025-11-07
**Status:** Complete and ready for next session
