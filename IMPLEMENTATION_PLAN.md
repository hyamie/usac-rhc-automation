# USAC RHC Automation - Complete Implementation Plan

**Created:** 2025-11-06
**Status:** Ready to Execute
**Estimated Time:** 2-3 hours

---

## 📋 What Will Be Done

### 1. Database Schema Updates
**File:** `database/schema_update_v2.sql`

**Add to `clinics_pending_review` table:**
```sql
-- Consultant detection
is_consultant boolean default false,
consultant_company text,
consultant_detection_method text, -- 'auto', 'manual_tagged', 'manual_untagged'

-- Historical funding (last 3 years)
funding_year_1 integer,
funding_amount_1 numeric(12, 2),
funding_year_2 integer,
funding_amount_2 numeric(12, 2),
funding_year_3 integer,
funding_amount_3 numeric(12, 2),

-- PDF link
form_465_pdf_url text,

-- Posting date (for filtering)
posting_date date,

-- Program type
program_type text check (program_type in ('Telecom', 'Healthcare Connect'))
```

**Add consultant companies table:**
```sql
create table public.consultant_companies (
  id uuid default uuid_generate_v4() primary key,
  company_name text unique not null,
  added_date timestamptz default now(),
  added_by text default 'system'
);

-- Pre-populate with known consultants
insert into public.consultant_companies (company_name) values
  ('Community Hospital Corporation');
```

---

### 2. USAC API Setup

**Steps to create API key:**
1. Go to: https://opendata.usac.org/profile/edit/developer_settings
2. Click "Create new API Key"
3. Name: "USAC RHC Automation"
4. Save the API key to: `C:\ClaudeAgents\config\.env`

**Add to .env:**
```env
USAC_API_KEY=your_api_key_here
USAC_FORM_465_ENDPOINT=https://opendata.usac.org/resource/[dataset-id].json
USAC_COMMITMENTS_ENDPOINT=https://opendata.usac.org/resource/sm8n-gg82.json
```

**API Query Examples:**
```
# Get Form 465 filings (Telecom only, last 7 days)
GET https://opendata.usac.org/resource/[dataset].json
?program=Telecom
&posting_start_date>2025-11-01
&$limit=1000
&$$app_token=YOUR_API_KEY

# Get historical funding by HCP number
GET https://opendata.usac.org/resource/sm8n-gg82.json
?hcp_number=70273
&funding_year>=2023
&$$app_token=YOUR_API_KEY
```

---

### 3. Updated n8n Workflows

#### **Workflow #1: Main Daily Monitor** (UPDATED)

**Changes:**
1. **USAC API Node** - Fetch Form 465 filings
   - Filter: `program=Telecom`
   - Filter: `posting_start_date` = last 7 days
   - Extract contact info from API/PDF data

2. **Consultant Detection Node** (NEW)
   - Compare contact employer vs HCP name
   - Check against consultant_companies table
   - Set `is_consultant` flag
   - Method: 'auto'

3. **Historical Funding Node** (NEW)
   - Query commitments/disbursements API by HCP number
   - Get last 3 years of funding
   - Store amounts and years

4. **Priority Scoring Node** (UPDATED)
   - Score based on:
     - Historical funding (higher = higher priority)
     - Number of years participating
     - Service type and bandwidth
     - Contract length
   - Calculate score 1-100
   - Assign label: High (80+), Medium (50-79), Low (<50)

5. **PDF URL Node** (NEW)
   - Generate PDF URL from HCP/Application numbers
   - Store in `form_465_pdf_url` field

6. **Supabase Insert**
   - Save all data including new fields

**New Fields Captured:**
- Main contact (name, title, phone, email, address)
- Service details
- Contract length
- Consultant flag
- Historical funding (3 years)
- PDF URL
- Posting date
- Program type

---

#### **Workflow #2: Enrichment Pipeline** (UPDATED)

**Changes:**
1. **Remove Hunter.io node** (not needed)

2. **LinkedIn Enrichment Node** (UPDATED)
   - Search for contact on LinkedIn
   - Extract:
     - Recent posts (last 30 days)
     - Published articles
     - Speaking engagements
     - Awards/recognition
     - Education
   - Focus: "Personal but professional" details

3. **Google Search Node** (NEW)
   - Search: "[Contact Name] [Title] healthcare"
   - Find:
     - Conference presentations
     - Industry publications
     - News mentions
     - Blog posts

4. **Claude AI Email Generation** (UPDATED)
   - **Two templates:**

   **Template A - Direct Clinic Contact:**
   ```
   Input to Claude:
   - Contact name, title
   - Clinic name, location
   - Service details
   - Enrichment findings
   - Contract info

   Prompt: Generate a personalized email to a healthcare facility contact about RHC telecom services. Include a specific reference to their [enrichment detail] to show genuine interest.
   ```

   **Template B - Consultant Contact:**
   ```
   Input to Claude:
   - Contact name, title
   - Consultant company
   - Client clinic name
   - Service details
   - Enrichment findings

   Prompt: Generate a personalized email to a telecom consultant representing [clinic]. Acknowledge their consulting role and expertise. Reference their [enrichment detail] to build rapport.
   ```

5. **Conditional Logic** (NEW)
   - IF node: Check `is_consultant` flag
   - Route to appropriate email template
   - Generate personalized subject line

6. **Microsoft Outlook Draft** (EXISTING)
   - Create draft email
   - Attach to contact record

7. **Supabase Update**
   - Set `enriched = true`
   - Store enrichment data
   - Set `enrichment_date`

---

#### **Workflow #3: Rule Monitor** (NO CHANGES)
Already complete - monitors USAC news/rules

---

### 4. Dashboard Updates

#### **New Components:**

**A. Date Filter (Top Bar)**
```tsx
// DateRangePicker.tsx
- Calendar popup (react-day-picker)
- Preset ranges: Today, Last 7 Days, Last 30 Days, Custom
- Filter clinics by posting_date
```

**B. Program Toggle (Top Bar)**
```tsx
// ProgramToggle.tsx
- Switch component: Telecom / Healthcare Connect
- Filter clinics by program_type
```

**C. Consultant Filter (Top Bar)**
```tsx
// ConsultantFilter.tsx
- Dropdown: Show All / Direct Only / Consultants Only
- Filter by is_consultant flag
```

**D. Clinic Card Updates**
```tsx
// ClinicCard.tsx - Add:
- Consultant badge (if is_consultant = true)
- Tag as Consultant button (if false positive)
- Tag as Direct button (if consultant but actually direct)
- Historical funding display (3 years with amounts)
- PDF link icon (opens PDF in new tab)
- Contract date display
```

**E. Historical Funding Display**
```tsx
// FundingHistory.tsx
- Table showing 3 years
- Year | Amount | Change %
- Visual trend indicator
```

**F. Manual Tagging Actions**
```tsx
// API routes:
POST /api/clinics/[id]/tag-consultant
POST /api/clinics/[id]/untag-consultant

Updates:
- is_consultant flag
- consultant_detection_method = 'manual_tagged' or 'manual_untagged'
```

#### **Dashboard View Updates:**

**Display Columns:**
1. HCP Number
2. HCP Name
3. Contact Name (with consultant badge)
4. Title
5. Phone
6. Email
7. Service Details (or PDF link)
8. Contract Date
9. Historical Funding (expandable)
10. Priority Score/Label
11. Enrichment Status
12. Actions (Enrich, Tag, View PDF)

**Sorting Options:**
- By posting date (newest first - default)
- By priority score (highest first)
- By funding amount (highest first)
- By clinic name (A-Z)

---

### 5. Environment Variables Needed

**Add to Supabase (n8n):**
```env
USAC_API_KEY=your_key_here
USAC_FORM_465_ENDPOINT=https://opendata.usac.org/resource/[dataset].json
USAC_COMMITMENTS_ENDPOINT=https://opendata.usac.org/resource/sm8n-gg82.json
LINKEDIN_API_KEY=your_key_or_alternative_service
ANTHROPIC_API_KEY=sk-ant-... (Claude AI)
```

**Already have:**
```env
SUPABASE_URL=https://fhuqiicgmfpnmficopqp.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOi...
N8N_API_KEY=eyJhbGciOi...
```

---

### 6. Known Consultant Companies (Initial List)

**To be added to database:**
1. Community Hospital Corporation
2. [Add more as discovered]

---

### 7. Testing Plan

**After implementation:**

1. **Test USAC API**
   - Fetch sample Form 465 filings
   - Verify contact data extraction
   - Check historical funding retrieval

2. **Test Consultant Detection**
   - Verify auto-detection (employer mismatch)
   - Test manual tagging buttons
   - Check false positive handling

3. **Test Enrichment**
   - Enrich a direct contact
   - Enrich a consultant contact
   - Verify different email templates

4. **Test Dashboard Filters**
   - Date range filtering
   - Program toggle
   - Consultant filter
   - Priority sorting

5. **Test End-to-End**
   - New filing appears in dashboard
   - Enrichment completes successfully
   - Email draft created in Outlook
   - Data updated in Supabase

---

## 🚀 Execution Order (When You Return)

**Phase 1: API Setup (15 min)**
1. Create USAC API key
2. Add to environment variables
3. Test API endpoints

**Phase 2: Database Updates (10 min)**
1. Run schema_update_v2.sql in Supabase
2. Verify new columns exist
3. Add initial consultant companies

**Phase 3: Update Workflows (45 min)**
1. Modify Workflow #1 (Main Daily Monitor)
2. Modify Workflow #2 (Enrichment Pipeline)
3. Test each workflow individually
4. Save and activate

**Phase 4: Dashboard Updates (60 min)**
1. Add new components (filters, toggles)
2. Update ClinicCard component
3. Add manual tagging API routes
4. Update display columns
5. Test locally

**Phase 5: Deploy & Test (30 min)**
1. Commit changes to GitHub
2. Deploy dashboard to Vercel
3. Test end-to-end flow
4. Verify all features working

**Total Time: ~2.5 hours**

---

## ✅ All Questions Answered

1. ✅ Consultant detection: Start empty, auto-add by email domain when manually tagged
2. ✅ USAC API credentials saved to config/.env
3. ✅ Email drafts: Create in "USAC drafts" folder in Outlook
4. ✅ CSV export analyzed - all fields identified
5. ✅ User has purchased more usage - proceed autonomously

## 📊 CSV Data Structure (From exp.csv)

**Available Fields:**
- Program (Telecom/HCF)
- Application Number, Funding Year
- HCP Number, HCP Name
- Contact First/Last Name, Phone, E-mail
- Posting Start Date, Allowable Contract Start Date
- Mail Contact info (consultant detection!)
- Link to FCC Form PDF
- Description of Services Requested
- Site Address, City, State, ZIP
- Category of Expense fields

**Consultant Detection from CSV:**
- Compare "Contact E-mail" vs "Mail Contact E-mail"
- If different domains = consultant
- Mail Contact is likely the consultant preparing the filing

---

## 📝 Notes

- All workflow JSON files will be updated before import
- Database schema backwards compatible (existing data safe)
- Dashboard will work with partial data (graceful degradation)
- Manual tagging allows correction of false positives/negatives
- PDF links are direct access (no parsing needed for display)

---

## ✅ Ready to Execute

**When you return in 2 hours, just say:**
"Start implementation"

And I'll execute this entire plan step by step!

---

## 🔗 Quick Reference Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/fhuqiicgmfpnmficopqp
- **n8n Instance:** https://hyamie.app.n8n.cloud
- **USAC Open Data:** https://opendata.usac.org/profile/edit/developer_settings
- **GitHub Repo:** https://github.com/hyamie/usac-rhc-automation
- **Vercel Dashboard:** https://vercel.com/hyamie
- **Live Dashboard:** https://dashboard-afce1q5st-mike-hyams-projects.vercel.app

