# Phase 1 Clean Workflow - Implementation Summary

**Created:** 2025-11-09
**File:** `C:\ClaudeAgents\projects\usac-rhc-automation\workflows\phase1_clean_workflow.json`
**Status:** Ready for import into n8n Cloud

---

## Overview

This is a **from-scratch**, clean implementation of the Phase 1 workflow as specified in `Detailed_Phase1_Workflow.md`. It contains exactly 6 core processing nodes plus supporting nodes for loop control.

---

## The 6 Core Nodes

### 1. Schedule Trigger - Daily 7 AM CST
- **Type:** `scheduleTrigger`
- **Schedule:** Every day at 7:00 AM (CST timezone)
- **Purpose:** Automatically starts the workflow to pull new Form 465 filings
- **Configuration:**
  - Interval-based trigger
  - Hour: 7
  - Daily execution

---

### 2. GET Form 465 Filings from USAC
- **Type:** `httpRequest`
- **Method:** `GET`
- **Endpoint:** `https://opendata.usac.org/resource/96rf-xd57.json`
- **Authentication:** None (open data API)
- **Query Parameters:**
  - `program`: "Telecom"
  - `$where`: `posting_date >= '[yesterday's date]'`
  - `$limit`: 1000
  - `$order`: "posting_date DESC"
- **Purpose:** Retrieves Form 465 filings posted in the last 24 hours
- **Notes:**
  - Uses correct USAC Open Data API endpoint
  - Dynamically calculates yesterday's date using `$now.minus({ days: 1 })`
  - Returns JSON array of filings

---

### 3. Extract and Transform Filing Data
- **Type:** `code` (Function node)
- **Purpose:** Normalizes USAC API data to match Supabase schema
- **Key Functions:**
  - `collectDocumentLinks()` - Combines RFP1-10 and AdditionalDoc1-10 into JSONB structure
  - Field mapping from USAC naming to Supabase column names
  - Creates deduplication hash (`form_465_hash`)
  - Handles null values and data validation
- **Output Fields Mapped:**
  - `hcp_number` ← `hcpnumber`
  - `clinic_name` ← `hcpname`
  - `application_number` ← `applicationnumber`
  - `address` ← `healthcaresite_addressline1`
  - `city` ← `healthcaresite_city`
  - `state` ← `healthcaresite_state`
  - `zip` ← `healthcaresite_zipcode` or `site_zip_code`
  - `contact_phone` ← `contact_phonenumber` or `contact_phone`
  - `additional_documents` ← Combined JSONB: `{rfp_links: [], additional_docs: []}`
  - Plus all other Supabase schema fields

---

### 4. Loop + Historical Funding Enrichment

This is actually **TWO nodes** working together:

#### 4a. Loop Over Each Clinic
- **Type:** `splitInBatches`
- **Batch Size:** 1 (process one clinic at a time)
- **Purpose:** Iterate through each transformed clinic record

#### 4b. GET Historical Funding Data
- **Type:** `httpRequest`
- **Method:** `GET`
- **Endpoint:** `https://opendata.usac.org/resource/historical-funding.json?hcpnumber={{ $json.hcp_number }}`
- **Query Parameters:**
  - `$where`: `funding_year IN ([current-1], [current-2])`
  - `$limit`: 100
- **Purpose:** Retrieves 2-year historical funding data for each HCP
- **Error Handling:** `neverError: true` (continues even if API fails)

**⚠️ QUESTION FOR YOU:**
The historical funding API endpoint is a **placeholder**. The spec document doesn't provide the actual USAC endpoint for historical Form 466/467 data.

**What is the correct endpoint?** Options:
- Is there a separate USAC Open Data table for historical funding?
- Do we need to query a different API?
- Should we skip this enrichment for now and add it later?

---

#### 4c. Merge Historical Funding
- **Type:** `code` (Function node)
- **Purpose:** Calculates priority score and merges historical data with clinic record
- **Calculations:**
  - `total_funding_3y` - Sum of all historical funding amounts
  - `participation_years` - Count of distinct funding years
  - `priority_score` - Calculated based on:
    - Funding amount (0-40 points)
    - Participation years (0-30 points)
    - Current year filing bonus (30 points)
  - `priority_label` - "High" (≥70), "Medium" (≥40), or "Low" (<40)
- **Output:** Enriched clinic record ready for database insert

---

### 5. Insert into Supabase
- **Type:** `supabase`
- **Operation:** `insert`
- **Table:** `clinics_pending_review`
- **Conflict Handling:** Skip duplicates based on `form_465_hash`
- **Purpose:** Saves enriched clinic record to database
- **Credentials Required:** Supabase API credentials must be configured in n8n

---

### 6. Log Completion
- **Type:** `code` (Function node)
- **Purpose:** Logs workflow execution summary
- **Output:**
  - Workflow name
  - Timestamp
  - Number of filings processed
  - Status (completed/failed)
  - Summary message
- **Console Output:** JSON formatted completion log
- **Future Enhancement:** Can be extended to send Slack/email notifications

---

## Supporting Nodes

### Loop Back (NoOp)
- **Type:** `noOp`
- **Purpose:** Routes execution back to the loop for the next clinic
- **Why Needed:** n8n requires explicit loop-back connection for `splitInBatches` node

---

## Data Flow

```
Schedule Trigger (7 AM daily)
    ↓
GET Form 465 Filings (USAC API)
    ↓
Extract and Transform (normalize data + collect documents)
    ↓
Loop Over Each Clinic (splitInBatches)
    ↓
GET Historical Funding (per HCP) ─→ Merge Historical Funding
    ↓                                       ↓
    └──────────────────────────────────────┘
                    ↓
        Insert into Supabase
                    ↓
              Loop Back ──→ (continues until all clinics processed)
                    ↓
           Log Completion
```

---

## Field Mappings: USAC API → Supabase

| Supabase Column | USAC API Field(s) | Type | Notes |
|----------------|-------------------|------|-------|
| `hcp_number` | `hcpnumber` | text | Required |
| `clinic_name` | `hcpname` | text | Required |
| `application_number` | `applicationnumber` | text | New field |
| `address` | `healthcaresite_addressline1` | text | |
| `city` | `healthcaresite_city` | text | |
| `state` | `healthcaresite_state` | text | Required |
| `zip` | `healthcaresite_zipcode`, `site_zip_code` | text | New field |
| `filing_date` | `posting_date` | timestamptz | |
| `form_465_hash` | Generated from HCP + date + address | text | Unique key |
| `service_type` | `descriptionofservicesrequested`, `service_type` | text | |
| `contract_length` | `requestedcontractperiod` | integer | Parsed to int |
| `bandwidth` | `bandwidth` | text | |
| `contact_name` | `contact_firstname` + `contact_lastname` | text | Combined |
| `contact_email` | `contact_email` | text | |
| `contact_phone` | `contact_phonenumber`, `contact_phone` | text | New field |
| `additional_documents` | `rfp1-10`, `additionaldoc1-10` | jsonb | **New JSONB field** |
| `priority_score` | Calculated from historical funding | integer | 0-100 |
| `priority_label` | Calculated: High/Medium/Low | text | Based on score |
| `total_funding_3y` | Sum from historical API | numeric | |
| `participation_years` | Count of distinct years | integer | |
| `enriched` | Set to `true` after enrichment | boolean | |
| `processed` | Default `false` | boolean | |

---

## Additional Documents JSONB Structure

The workflow collects up to 20 document links from the USAC API and stores them in a structured JSONB format:

```json
{
  "rfp_links": [
    "https://usac.org/doc1.pdf",
    "https://usac.org/doc2.pdf"
  ],
  "additional_docs": [
    "https://usac.org/addoc1.pdf"
  ]
}
```

This matches the Supabase schema defined in `schema_update_v3_alignment_fix.sql`.

---

## Import Instructions

1. **In n8n Cloud:**
   - Go to Workflows → Import from File
   - Select `phase1_clean_workflow.json`
   - Click "Import"

2. **Configure Supabase Credentials:**
   - Open the "Insert into Supabase" node
   - Click "Select Credential" → "Create New"
   - Enter your Supabase:
     - Project URL: `https://[your-project].supabase.co`
     - API Key: `[your-service-role-key]`
   - Save credentials

3. **Test the Workflow:**
   - Click "Execute Workflow" (manual test)
   - Check n8n execution log for errors
   - Verify data appears in Supabase `clinics_pending_review` table

4. **Activate the Schedule:**
   - Click "Active" toggle in top-right
   - Workflow will now run daily at 7 AM CST

---

## Known Issues / Questions

### ❓ Historical Funding API Endpoint
**Status:** UNKNOWN

The spec calls for historical funding enrichment (Form 466/467 data), but the correct USAC API endpoint is not documented.

**Current Placeholder:**
```
https://opendata.usac.org/resource/historical-funding.json?hcpnumber=X
```

**Action Required:**
- Identify the correct USAC Open Data table for historical funding
- Update the endpoint in Node 4b ("GET Historical Funding Data")
- OR disable historical enrichment temporarily and set `priority_score` to null

**Possible Solutions:**
1. Use USAC Open Data portal: https://opendata.usac.org/browse
2. Search for "Form 466" or "Form 467" datasets
3. Contact USAC for API documentation
4. Phase 1 MVP: Skip historical enrichment, focus on Form 465 data only

---

## Testing Checklist

- [ ] Import workflow into n8n Cloud
- [ ] Configure Supabase credentials
- [ ] Test Node 2: Verify USAC API returns data
- [ ] Test Node 3: Check field transformations and JSONB structure
- [ ] Test Node 4: Confirm historical funding API (or disable for now)
- [ ] Test Node 5: Verify Supabase insert works
- [ ] Check deduplication: Run workflow twice, ensure no duplicates
- [ ] Verify `additional_documents` JSONB structure in Supabase
- [ ] Activate schedule and monitor first automated run

---

## Next Steps (Phase 2)

After Phase 1 is stable:
1. Build web dashboard to display `clinics_pending_review` data
2. Add manual enrichment trigger (Apollo.io, LinkedIn)
3. Add email draft generation
4. Build approval workflow

---

## Files Created

- **Workflow JSON:** `C:\ClaudeAgents\projects\usac-rhc-automation\workflows\phase1_clean_workflow.json`
- **This Summary:** `C:\ClaudeAgents\projects\usac-rhc-automation\workflows\PHASE1_WORKFLOW_SUMMARY.md`

---

**Built with:** Clean, from-scratch implementation following spec exactly
**Ready for:** n8n Cloud import and testing
