# USAC RHC Automation - Field Comparison Table

**Date:** November 9, 2025

This table shows which fields exist in each system and identifies mismatches.

---

## Legend

- ✅ = Field exists and working
- ❌ = Field missing (causes error)
- ⚠️ = Field exists but not used
- 🆕 = Field needs to be added

---

## Complete Field Comparison

| Field Name | USAC API | n8n Workflow | Supabase DB | Status | Priority |
|-----------|----------|--------------|-------------|--------|----------|
| **Core Identifiers** |
| id | N/A | ⚠️ Auto-generated | ✅ uuid PK | OK | - |
| hcp_number | ✅ | ✅ | ✅ text | ✅ WORKING | HIGH |
| application_number | ✅ | ✅ | ❌ MISSING | 🆕 ADD TO DB | **CRITICAL** |
| form_465_hash | N/A | ✅ Generated | ✅ text | ✅ WORKING | HIGH |
| **Clinic Information** |
| clinic_name | ✅ site_name | ✅ | ✅ text | ✅ WORKING | HIGH |
| address | ✅ site_address | ✅ | ✅ text | ✅ WORKING | MEDIUM |
| city | ✅ site_city | ✅ | ✅ text | ✅ WORKING | MEDIUM |
| state | ✅ site_state | ✅ | ✅ text | ✅ WORKING | HIGH |
| zip | ✅ site_zip_code | ✅ | ❌ MISSING | 🆕 ADD TO DB | **CRITICAL** |
| **Contact Information** |
| contact_name | ✅ | ✅ | ✅ text | ✅ WORKING | MEDIUM |
| contact_title | ✅ | ✅ | ✅ text | ✅ WORKING | LOW |
| contact_email | ✅ | ✅ | ✅ text | ✅ WORKING | HIGH |
| contact_phone | ✅ | ✅ | ❌ MISSING | 🆕 ADD TO DB | **CRITICAL** |
| **Mail Contact (Consultant)** |
| mail_contact_name | ✅ | ✅ | ✅ text | ✅ WORKING | MEDIUM |
| mail_contact_email | ✅ | ✅ | ✅ text | ✅ WORKING | MEDIUM |
| mail_contact_company | ✅ | ✅ | ✅ text | ✅ WORKING | MEDIUM |
| **Consultant Detection** |
| is_consultant | N/A | ✅ Calculated | ✅ boolean | ✅ WORKING | HIGH |
| consultant_company | N/A | ✅ Calculated | ✅ text | ✅ WORKING | MEDIUM |
| consultant_email_domain | N/A | ✅ Calculated | ✅ text | ✅ WORKING | MEDIUM |
| consultant_detection_method | N/A | ✅ Calculated | ✅ text | ✅ WORKING | LOW |
| **Dates** |
| filing_date | ✅ | ✅ | ✅ timestamptz | ✅ WORKING | HIGH |
| posting_date | ✅ posting_start_date | ✅ | ✅ date | ✅ WORKING | MEDIUM |
| allowable_contract_start_date | ✅ | ✅ | ✅ date | ✅ WORKING | MEDIUM |
| created_at | N/A | ✅ Generated | ✅ timestamptz | ✅ WORKING | - |
| updated_at | N/A | N/A | ✅ timestamptz | ✅ WORKING | - |
| **Program Information** |
| program_type | ✅ program | ✅ Hardcoded "Telecom" | ✅ text | ✅ WORKING | MEDIUM |
| service_type | ✅ | ✅ | ✅ text | ✅ WORKING | LOW |
| description_of_services | ✅ narrative_description | ✅ | ✅ text | ✅ WORKING | LOW |
| **Contract Details** |
| contract_length | ✅ contract_term_months | ✅ | ✅ integer | ✅ WORKING | LOW |
| bandwidth | ✅ bandwidth_mbps | ✅ | ✅ text | ✅ WORKING | LOW |
| **Form 465 PDF** |
| form_465_pdf_url | N/A | ✅ Generated from app# | ✅ text | ✅ WORKING | MEDIUM |
| **Historical Funding** |
| funding_year_1 | N/A | ⚠️ Not in current flow | ✅ integer | ⚠️ UNUSED | MEDIUM |
| funding_amount_1 | N/A | ⚠️ Not in current flow | ✅ numeric | ⚠️ UNUSED | MEDIUM |
| funding_year_2 | N/A | ⚠️ Not in current flow | ✅ integer | ⚠️ UNUSED | MEDIUM |
| funding_amount_2 | N/A | ⚠️ Not in current flow | ✅ numeric | ⚠️ UNUSED | MEDIUM |
| funding_year_3 | N/A | ⚠️ Not in current flow | ✅ integer | ⚠️ UNUSED | MEDIUM |
| funding_amount_3 | N/A | ⚠️ Not in current flow | ✅ numeric | ⚠️ UNUSED | MEDIUM |
| total_funding_3y | N/A | ⚠️ Not in current flow | ✅ numeric | ⚠️ UNUSED | MEDIUM |
| **Priority Scoring** |
| priority_score | N/A | ⚠️ Not in current flow | ✅ integer | ⚠️ UNUSED | MEDIUM |
| priority_label | N/A | ⚠️ Not in current flow | ✅ text | ⚠️ UNUSED | MEDIUM |
| location_count | ✅ | ❌ Not extracted | ✅ integer | ⚠️ UNUSED | LOW |
| participation_years | ✅ | ❌ Not extracted | ✅ integer | ⚠️ UNUSED | LOW |
| **Document Links** |
| rfp_1 to rfp_10 | ✅ (10 fields) | ❌ Not extracted | ❌ MISSING | 🆕 ADD TO DB | HIGH |
| additional_document_1 to _10 | ✅ (10 fields) | ❌ Not extracted | ❌ MISSING | 🆕 ADD TO DB | HIGH |
| additional_documents | N/A | 🆕 Should combine above | ❌ MISSING | 🆕 ADD TO DB | HIGH |
| **Enrichment Fields** |
| enriched | N/A | ⚠️ Phase 2 | ✅ boolean | ⚠️ PHASE 2 | LOW |
| clinic_website | N/A | ⚠️ Phase 2 | ✅ text | ⚠️ PHASE 2 | LOW |
| linkedin_url | N/A | ⚠️ Phase 2 | ✅ text | ⚠️ PHASE 2 | LOW |
| enrichment_date | N/A | ⚠️ Phase 2 | ✅ timestamptz | ⚠️ PHASE 2 | LOW |
| **Dashboard Fields** |
| processed | N/A | ✅ Default false | ✅ boolean | ✅ WORKING | MEDIUM |
| assigned_to | N/A | ❌ Not set | ✅ text | ⚠️ UNUSED | LOW |
| email_draft_created | N/A | ❌ Not set | ✅ boolean | ⚠️ UNUSED | LOW |
| notes | N/A | ❌ Not set | ✅ text | ⚠️ UNUSED | LOW |

---

## Summary Statistics

### By Status
- ✅ Working: 32 fields
- ❌ Critical Missing: 4 fields (application_number, zip, contact_phone, additional_documents)
- ⚠️ Unused/Phase 2: 12 fields
- 🆕 Need to Add: 4 fields

### By Priority
- **CRITICAL** (blocking workflow): 3 fields
- **HIGH** (data quality): 9 fields
- **MEDIUM** (nice to have): 18 fields
- **LOW** (future enhancement): 10 fields

---

## Critical Issues (Must Fix Immediately)

1. **application_number** - Workflow tries to insert, DB rejects → **PGRST204 ERROR**
2. **zip** - Data loss, important for location analysis
3. **contact_phone** - Data loss, important for outreach
4. **additional_documents** - 20 document links not being stored

---

## Phase 2 Issues (Fix Later)

These fields exist in DB but workflow doesn't populate them yet:
- Historical funding (funding_year_1/2/3, funding_amount_1/2/3, total_funding_3y)
- Priority scoring (priority_score, priority_label)
- Location tracking (location_count, participation_years)
- Enrichment (enriched, clinic_website, linkedin_url, enrichment_date)
- Dashboard (assigned_to, email_draft_created, notes)

These will be populated when you implement:
- "Query Historical Funding (3 Years)" node
- "Calculate Priority & Merge Data" node
- Enrichment sub-workflow
- Dashboard features

---

## Data Type Reference

| Database Type | Example Value | Notes |
|--------------|---------------|-------|
| text | "RHC46500001741" | Variable length string |
| integer | 12 | Whole numbers |
| numeric(12,2) | 1234567.89 | Decimal with 2 places |
| boolean | true/false | True or false |
| date | "2025-11-09" | Date only |
| timestamptz | "2025-11-09T10:30:00Z" | Date + time + timezone |
| jsonb | {"rfp_links": [...]} | JSON object/array |
| uuid | "55c2e448-b414-..." | Auto-generated ID |

---

## USAC API Field Name Variations

USAC API uses different names that need to be mapped:

| USAC API Field | Maps To | Notes |
|---------------|---------|-------|
| hcp_number | hcp_number | Direct match |
| health_care_provider_number | hcp_number | Alternative name |
| site_name | clinic_name | Building name |
| health_care_provider_name | clinic_name | Alternative |
| site_address | address | Street address |
| service_delivery_site_physical_address | address | Full name |
| site_city | city | Direct match |
| service_delivery_site_city | city | Full name |
| site_state | state | 2-letter code |
| service_delivery_site_state | state | Full name |
| site_zip | zip | Direct match |
| site_zip_code | zip | Alternative |
| service_delivery_site_zip_code | zip | Full name |
| contact_person_name | contact_name | Direct match |
| contact_name | contact_name | Alternative |
| contact_phone_number | contact_phone | Direct match |
| contact_telephone_number | contact_phone | Alternative |
| application_number | application_number | Form 465 ID |
| form_465_application_number | application_number | Alternative |

---

## Next Steps

1. ✅ Identify missing fields - COMPLETE
2. ✅ Create migration script - COMPLETE
3. ⏳ Run migration in Supabase - PENDING
4. ⏳ Update n8n workflow - PENDING
5. ⏳ Test end-to-end - PENDING
6. ⏳ Deploy to production - PENDING

---

**See QUICK_FIX_SUMMARY.md for implementation steps**
