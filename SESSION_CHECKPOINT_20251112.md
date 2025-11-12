# USAC RHC Automation - Session Checkpoint
**Date:** 2025-11-12
**Phase:** 4.2 - Workflow Testing & O365 Setup

---

## ✅ COMPLETED TODAY

### 1. Database Migrations
- ✅ Fixed foreign key constraint issue (removed FK on clinics table)
- ✅ Executed all Phase 4 migrations successfully
- ✅ Created `clinics` view as alias for `clinics_pending_review`
- ✅ All tables created: email_templates, email_instances, template_edits, weekly_performance, voice_model

### 2. n8n Workflow Import & Configuration
- ✅ Imported HTTP-enabled workflow: `outreach_email_generation_HTTP.json`
- ✅ Converted all Supabase nodes to HTTP Request nodes
- ✅ Fixed Node 2 URL (removed leading `=` that was causing "Invalid URL" error)
- ✅ Fixed Node 3 consultant detection logic (use `mail_contact_is_consultant` field)
- ✅ Fixed Node 5 Perplexity model name (`llama-3.1-sonar-small-128k-online` → `sonar`)
- ✅ Fixed Node 6 contact name parsing (use `mail_contact_first_name`/`last_name` instead of `contact_name.split()`)

### 3. Workflow Testing (Nodes 1-6)
- ✅ **Node 1 (Webhook):** Receives data correctly
- ✅ **Node 2 (Get Clinic Details):** Retrieves clinic from Supabase successfully
- ✅ **Node 3 (Determine Contact Type):** Returns "direct" and "week-46-2025" correctly
- ✅ **Node 4 (Get Template):** Returns Template A (rotation working)
- ✅ **Node 5 (Perplexity Enrichment):** Credential works, returns data
- ✅ **Node 6 (Render Template):** Successfully renders personalized email

**Test Data Used:**
- Clinic: Honesdale Family Health Center (HCP 50472)
- Clinic ID: `74d6a4d2-cdd6-43db-8038-a01de7ddf8bb`
- Contact: Whittney Walker (wwalker@communityhospitalcorp.com)

### 4. Credentials Setup
- ✅ Perplexity AI: Configured and working
- ⏸️ Microsoft O365: Partially configured (see BLOCKED section)

---

## ⏸️ BLOCKED - WAITING ON ADMIN

### O365 OAuth2 Configuration Issue

**Problem:** Redirect URI mismatch error

**Error Message:**
```
AADSTS50011: The redirect URI 'https://oauth.n8n.cloud/oauth2/callback' specified
in the request does not match the redirect URIs configured for the application
'6175fba2-7b47-4c60-ac05-06064b063906'
```

**O365 Credentials Received:**
- Application ID (Client): `6175fba2-7b47-4c60-ac05-06064b063906`
- Directory ID (Tenant): `28bf3eae-b2bf-40ec-9bf8-9cb0873f99e2`
- Client Secret Value: `XwI8Q~pCBrZOAnQpwf2aniLWBof3~oV86ALi3al9`
- Secret ID: `4260202f-a717-487e-97d4-ffa108a852e0`

**n8n OAuth2 Credential Configuration:**
- Credential Type: OAuth2 API (Generic)
- Grant Type: Authorization Code
- Authorization URL: `https://login.microsoftonline.com/28bf3eae-b2bf-40ec-9bf8-9cb0873f99e2/oauth2/v2.0/authorize`
- Access Token URL: `https://login.microsoftonline.com/28bf3eae-b2bf-40ec-9bf8-9cb0873f99e2/oauth2/v2.0/token`
- Client ID: `6175fba2-7b47-4c60-ac05-06064b063906`
- Client Secret: `XwI8Q~pCBrZOAnQpwf2aniLWBof3~oV86ALi3al9`
- Scope: `https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access`
- Auth URI Query Parameters: `access_type=offline`
- Authentication: Header

**ACTION REQUIRED FROM ADMIN:**

Ask your admin to add this redirect URI to the Azure AD app registration:

```
https://oauth.n8n.cloud/oauth2/callback
```

**Admin Steps:**
1. Azure Portal → Azure Active Directory → App Registrations
2. Find app: `6175fba2-7b47-4c60-ac05-06064b063906`
3. Click **Authentication** (left sidebar)
4. Under **Redirect URIs**, click **"+ Add a platform"** or **"+ Add URI"**
5. Select **Web** platform
6. Add URI: `https://oauth.n8n.cloud/oauth2/callback`
7. Click **Save**

**Once completed:** Return to n8n credential and click "Connect my account" again.

---

## 🔧 ISSUES TO FIX

### 1. Perplexity Enrichment Context (Node 5)

**Problem:** Perplexity is returning generic November 2025 news (government shutdowns, elections, etc.) instead of clinic-specific information.

**Current Prompt Issue:** The prompt is asking for generic current events instead of clinic research.

**Fixes Needed:**
1. Update prompt to specifically research the clinic: "Honesdale Family Health Center in Honesdale, PA"
2. Upgrade model from `sonar` to `sonar-pro` for better quality research
3. Adjust prompt to focus on: recent news about the clinic, healthcare initiatives, community involvement, facility updates

**Location:** Node 5 - Perplexity: Enrich Context (HTTP Request node)

**Expected Output:** Recent, relevant information about the specific clinic to personalize the email.

---

## 📋 NEXT STEPS (IN ORDER)

### Immediate (Once O365 Redirect URI Fixed)
1. ✅ Admin adds redirect URI to Azure AD app
2. Complete O365 credential connection in n8n
3. Test Node 7 (O365: Create Draft) - should create draft in Mike's Outlook

### Fix Perplexity Enrichment (Node 5)
1. Update model: `sonar` → `sonar-pro`
2. Fix prompt to research specific clinic
3. Test enrichment returns relevant clinic information

### Complete Workflow Testing
1. Test Nodes 7-9 (O365 Draft, Store Instance, Update Template Usage)
2. Test full end-to-end workflow via webhook
3. Verify draft appears in Mike's Outlook Drafts folder
4. Verify email_instances record created in Supabase
5. Verify template times_used incremented

### Generate Consultant Templates
**Issue Found:** No templates exist for `contact_type = 'consultant'`
- Node 4 returns empty when consultant detected
- Need to create 3 A/B/C templates for consultant outreach
- Similar structure to direct templates but different messaging

### Activate & Secure Workflow
1. Generate webhook authentication token
2. Activate workflow (enable in n8n)
3. Get production webhook URL
4. Update dashboard `.env.local` with webhook URL and token
5. Test from dashboard "Start Outreach" button

### Final Deliverables
1. Create final handoff document
2. Document consultant template creation process
3. Update workflow documentation with fixes applied
4. Add troubleshooting guide for common issues

---

## 📁 KEY FILES

### Workflows
- `C:\claudeagents\projects\usac-rhc-automation\workflows\outreach_email_generation_HTTP.json` - Main workflow (HTTP-enabled)
- `C:\claudeagents\projects\usac-rhc-automation\workflows\TEST_WORKFLOW_CONFIG.md` - Testing guide
- `C:\claudeagents\projects\usac-rhc-automation\workflows\HTTP_NODE_CONFIGS.md` - HTTP node configurations
- `C:\claudeagents\projects\usac-rhc-automation\workflows\O365_SETUP_FOR_ADMIN.md` - Admin setup guide
- `C:\claudeagents\projects\usac-rhc-automation\workflows\O365_N8N_CONFIGURATION.md` - n8n O365 config guide

### Database
- `C:\claudeagents\projects\usac-rhc-automation\database\PHASE4_ALL_MIGRATIONS_FIXED.sql` - Consolidated migrations
- `C:\claudeagents\projects\usac-rhc-automation\database\schema.sql` - Full schema

### Testing Scripts
- `C:\claudeagents\projects\usac-rhc-automation\test-webhook.ps1` - Fires test webhook
- `C:\claudeagents\projects\usac-rhc-automation\test-supabase.ps1` - Tests Supabase queries directly

---

## 🔑 CONFIGURATION DETAILS

### Supabase
- **URL:** `https://fhuqiicgmfpnmficopqp.supabase.co`
- **Service Role Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodXFpaWNnbWZwbm1maWNvcHFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQzOTkzNiwiZXhwIjoyMDc4MDE1OTM2fQ.mftyuE4grE-CSaT-KQh6iyzV1pcdBnwyarGAm6OFbf8`
- **Tables:** clinics_pending_review (+ alias "clinics"), email_templates, email_instances, template_edits, weekly_performance, voice_model

### n8n
- **Instance:** `https://hyamie.app.n8n.cloud`
- **Test Webhook URL:** `https://hyamie.app.n8n.cloud/webhook-test/outreach-email`
- **Production Webhook URL:** `https://hyamie.app.n8n.cloud/webhook/outreach-email` (once activated)

### Perplexity AI
- ✅ Credential configured in n8n
- Current model: `sonar`
- Recommended model: `sonar-pro` (better quality)

### Microsoft O365
- ⏸️ Waiting on redirect URI fix
- Node 7 will remain non-functional until OAuth completes

---

## 🧪 TEST RESULTS

### Successful Test Output (Node 6)

```json
{
  "clinic_id": "74d6a4d2-cdd6-43db-8038-a01de7ddf8bb",
  "template_id": "1bac9ce9-e674-4ed6-a017-3509da4d73e0",
  "template_variant": "A",
  "times_used": 0,
  "subject_rendered": "USAC RHC Support - Honesdale Family Health Center",
  "body_rendered": "Whittney,\r\n\r\nI saw Honesdale Family Health Center's Form 465 filing for 2026...",
  "enrichment_data": {
    "source": "perplexity",
    "context": "[Generic news about November 2025 - needs fixing]",
    "cost": 0.005
  },
  "recipient_email": "wwalker@communityhospitalcorp.com",
  "recipient_name": "Whittney Walker"
}
```

**Notes:**
- ✅ Template rendering works perfectly
- ✅ Personalization correct (Whittney, clinic name, etc.)
- ⚠️ Enrichment context needs to be clinic-specific, not generic news

---

## 💬 RESUME PROMPT

When resuming, use this context:

"We successfully tested Nodes 1-6 of the USAC RHC outreach workflow. All nodes work except:

1. **O365 (Node 7):** Blocked on redirect URI mismatch. Admin needs to add `https://oauth.n8n.cloud/oauth2/callback` to Azure AD app.

2. **Perplexity enrichment (Node 5):** Returns generic news instead of clinic-specific information. Need to fix prompt and upgrade to `sonar-pro` model.

Next steps: Either wait for O365 redirect URI fix, or move forward with fixing the Perplexity prompt."

---

## 📊 WORKFLOW STATUS

**Nodes Status:**
- ✅ Node 1: Webhook - Working
- ✅ Node 2: Get Clinic Details - Working
- ✅ Node 3: Determine Contact Type - Working (fixed)
- ✅ Node 4: Get Template - Working
- ⚠️ Node 5: Perplexity Enrichment - Works but needs prompt fix
- ✅ Node 6: Render Template - Working (fixed)
- ⏸️ Node 7: O365 Create Draft - Blocked on OAuth
- ❓ Node 8: Store Email Instance - Not tested yet
- ❓ Node 9: Increment Template Usage - Not tested yet
- ❓ Node 10: Respond to Dashboard - Not tested yet

**Overall Progress:** ~60% complete

---

**End of Checkpoint**
