# API Credentials Setup Guide
## Phase 4.2: Outreach Email Generation Workflow

---

## Overview

Before importing the n8n workflow, you need to set up 4 API integrations:

1. ✅ **Supabase** (Already configured from Phase 1-3)
2. 🔧 **Perplexity AI** (For enrichment)
3. 🔧 **Microsoft O365** (For email drafts)
4. 🔧 **Webhook Auth Token** (For dashboard security)

---

## 1. Supabase (Already Done ✅)

**Status:** Already configured in n8n from previous phases

**Verification:**
1. Go to: https://hyamie.app.n8n.cloud
2. Settings → Credentials
3. Search for: "USAC Supabase" or "Supabase"
4. Should see existing credential with Supabase URL

**If Missing, Set Up:**
- Credential Type: **Supabase API**
- Name: `USAC Supabase`
- Host: `fhuqiicgmfpnmficopqp.supabase.co`
- Service Role Key: (From `dashboard/.env.local` → `SUPABASE_SERVICE_ROLE_KEY`)

---

## 2. Perplexity AI (New - Required)

**Purpose:** AI-powered enrichment with recent, relevant clinic information
**Cost:** ~$0.005 per request

### Step-by-Step Setup

**2.1 Get API Key**

1. Go to: https://www.perplexity.ai/api
2. Sign up or log in
3. Navigate to: API Keys section
4. Click: "Create New API Key"
5. Name: "USAC RHC Enrichment"
6. Copy the API key (starts with `pplx-...`)
7. **IMPORTANT:** Save it securely (won't be shown again)

**2.2 Test API Key (Optional)**

```bash
curl -X POST https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.1-sonar-small-128k-online",
    "messages": [{"role": "user", "content": "Test message"}]
  }'
```

Expected: 200 OK with response

**2.3 Add to n8n**

1. Go to: https://hyamie.app.n8n.cloud
2. Settings → Credentials → Add Credential
3. Search for: "HTTP Header Auth"
4. Click: "HTTP Header Auth"
5. Fill in:
   - **Credential Name:** `Perplexity API`
   - **Name:** `Authorization`
   - **Value:** `Bearer YOUR_API_KEY_HERE`
6. Click: "Create"

**2.4 Pricing Reference**

- Model: `llama-3.1-sonar-small-128k-online`
- Cost: ~$0.005 per request (200 tokens)
- Monthly (20 emails/day): $3.00
- See: https://docs.perplexity.ai/docs/pricing

---

## 3. Microsoft O365 OAuth (New - Required)

**Purpose:** Create email drafts in Mike's Outlook account
**Cost:** Free (included with O365 subscription)

### Step-by-Step Setup

**3.1 Create Azure AD App Registration**

1. Go to: https://portal.azure.com
2. Navigate to: **Azure Active Directory** → **App registrations**
3. Click: **New registration**
4. Fill in:
   - **Name:** `USAC RHC Outreach Automation`
   - **Supported account types:** `Accounts in this organizational directory only (Single tenant)`
   - **Redirect URI:**
     - Platform: `Web`
     - URI: `https://hyamie.app.n8n.cloud/rest/oauth2-credential/callback`
5. Click: **Register**
6. **Copy these values (you'll need them):**
   - Application (client) ID
   - Directory (tenant) ID

**3.2 Create Client Secret**

1. In your app registration, go to: **Certificates & secrets**
2. Click: **New client secret**
3. Fill in:
   - **Description:** `n8n workflow secret`
   - **Expires:** `24 months` (recommended)
4. Click: **Add**
5. **IMMEDIATELY COPY the secret value** (won't be shown again)

**3.3 Set API Permissions**

1. In your app registration, go to: **API permissions**
2. Click: **Add a permission**
3. Select: **Microsoft Graph** → **Delegated permissions**
4. Search and add these permissions:
   - ☑️ `Mail.ReadWrite` - Read and write mail
   - ☑️ `Mail.Send` - Send mail as a user
   - ☑️ `User.Read` - Sign in and read user profile
5. Click: **Add permissions**
6. Click: **Grant admin consent for [Your Organization]**
7. Confirm: Yes

**3.4 Add to n8n**

1. Go to: https://hyamie.app.n8n.cloud
2. Settings → Credentials → Add Credential
3. Search for: "Microsoft OAuth2 API"
4. Click: "Microsoft OAuth2 API"
5. Fill in:
   - **Credential Name:** `O365 Mike Hyams`
   - **Grant Type:** `Authorization Code`
   - **Authorization URL:** `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
   - **Access Token URL:** `https://login.microsoftonline.com/common/oauth2/v2.0/token`
   - **Client ID:** (From step 3.1)
   - **Client Secret:** (From step 3.2)
   - **Scope:** `https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access`
   - **Auth URI Query Parameters:**
     - Name: `tenant`, Value: `common`
   - **Authentication:** `Body`
6. Click: **Connect my account**
7. Sign in with Mike's O365 account
8. Grant permissions
9. Click: **Create**

**3.5 Verify Setup**

Test that the credential works:
1. Create a test HTTP Request node in n8n
2. Method: GET
3. URL: `https://graph.microsoft.com/v1.0/me`
4. Authentication: `Predefined Credential Type` → `Microsoft OAuth2 API`
5. Select: `O365 Mike Hyams`
6. Execute node
7. Should return: Mike's user profile (displayName, mail, etc.)

**Troubleshooting:**
- Error 401: Check permissions granted
- Error 403: Verify API permissions in Azure AD
- Token expired: Re-authenticate in n8n credentials

---

## 4. Webhook Authentication Token (New - Required)

**Purpose:** Secure webhook endpoint from unauthorized access
**Cost:** Free

### Step-by-Step Setup

**4.1 Generate Secure Token**

Use one of these methods:

**Method A: OpenSSL (Recommended)**
```bash
openssl rand -hex 32
```

**Method B: Python**
```python
import secrets
print(secrets.token_urlsafe(32))
```

**Method C: Online Generator**
- Go to: https://www.random.org/strings/
- Length: 32
- Characters: Alphanumeric
- Generate

**4.2 Store Token Securely**

Save the token in two places:

**a) In n8n Cloud (for workflow)**
1. Go to: https://hyamie.app.n8n.cloud
2. Settings → Variables
3. Click: **Add Variable**
4. Name: `WEBHOOK_AUTH_TOKEN`
5. Value: `[your-generated-token]`
6. Save

**b) In dashboard .env.local (for frontend)**
```bash
# Add to dashboard/.env.local
N8N_WEBHOOK_AUTH_TOKEN=your-generated-token-here
```

**4.3 Configure in Webhook Node**

This is already set up in the workflow JSON:
- Node: "Webhook: Start Outreach"
- Authentication: Header Auth
- Header Name: `X-Webhook-Token`
- Header Value: Will be checked by n8n

---

## Summary Checklist

Before importing the workflow, verify you have:

- [x] **Supabase credential** - Already exists from Phase 1-3
- [ ] **Perplexity API credential** - HTTP Header Auth with Bearer token
- [ ] **O365 OAuth credential** - Microsoft OAuth2 with Mail permissions
- [ ] **Webhook auth token** - Stored in n8n Variables and dashboard .env.local

---

## Credential Names Reference

When importing the workflow, these credential names must match:

| Credential Type | Expected Name in n8n | Used In Nodes |
|----------------|---------------------|---------------|
| Supabase API | `USAC Supabase` | Get Clinic, Get Template, Store Instance, Update Usage |
| HTTP Header Auth (Perplexity) | `Perplexity API` | Perplexity: Enrich Context |
| Microsoft OAuth2 API | `O365 Mike Hyams` | O365: Create Draft |
| Webhook Variable | `WEBHOOK_AUTH_TOKEN` | Webhook: Start Outreach |

**If names don't match:** Update them in the workflow after import

---

## Testing Credentials

### Test Supabase
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM clinics WHERE status = 'pending_review';
```

### Test Perplexity
```bash
curl -X POST https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.1-sonar-small-128k-online","messages":[{"role":"user","content":"Test"}]}'
```

### Test O365
```bash
# Use n8n test node to call:
GET https://graph.microsoft.com/v1.0/me/messages?$top=1
```

### Test Webhook Auth
```bash
curl -X POST https://hyamie.app.n8n.cloud/webhook/outreach-email \
  -H "X-Webhook-Token: your-token" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## Cost Summary

| Service | Setup Cost | Monthly Cost (20 emails/day) |
|---------|-----------|------------------------------|
| Supabase | Free | Free (within limits) |
| Perplexity AI | Free | $3.00 |
| Microsoft O365 | Free | $0 (included) |
| n8n Cloud | $0 | $0 (existing plan) |
| **Total** | **$0** | **~$3.00** |

---

## Security Best Practices

1. **Never commit credentials to git**
   - All tokens in .env files (in .gitignore)
   - Use n8n Variables for sensitive data

2. **Rotate tokens regularly**
   - O365 client secret: Every 12-24 months
   - Webhook token: Every 6 months
   - Perplexity key: If exposed

3. **Monitor API usage**
   - Perplexity dashboard: Check daily usage
   - Azure AD: Monitor sign-ins
   - n8n executions: Review logs

4. **Limit permissions**
   - O365: Only Mail.ReadWrite and Mail.Send
   - Supabase: Use service_role only in server
   - Webhook: Validate token on every request

---

## Troubleshooting

### Supabase Connection Failed
- ✅ Check service role key is correct
- ✅ Verify Supabase project is active
- ✅ Test connection in n8n credential test

### Perplexity API Error
- ✅ Verify API key format: `Bearer pplx-...`
- ✅ Check quota: https://www.perplexity.ai/api/usage
- ✅ Ensure model name is correct

### O365 Authentication Failed
- ✅ Re-authenticate in n8n credentials
- ✅ Verify permissions granted in Azure AD
- ✅ Check token hasn't expired

### Webhook 401 Unauthorized
- ✅ Token matches in n8n Variables and dashboard
- ✅ Header name is exactly: `X-Webhook-Token`
- ✅ Token is being sent in request

---

## Next Steps

After setting up all credentials:

1. ✅ Verify all 4 credentials are configured
2. → Import workflow: `outreach_email_generation.json`
3. → Test workflow with 1 clinic
4. → Integrate webhook URL into dashboard
5. → Monitor first 5 executions

---

*Setup Guide Version: 1.0*
*Created: 2025-11-11*
*Phase: 4.2*
