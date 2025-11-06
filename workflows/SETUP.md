# n8n Workflows Setup Instructions

This guide walks you through importing and configuring all 3 n8n workflows for the USAC RHC automation system.

---

## Prerequisites

Before starting, ensure you have:

-  n8n instance running at `https://hyamie.app.n8n.cloud`
-  Supabase project created with schema deployed
-  All API keys from `../ENV_VARIABLES.md`

---

## Step 1: Configure n8n Credentials

You need to create credentials for all external services. In n8n:

### 1.1 Supabase Service Role (HTTP Header Auth)

1. Go to **Credentials** ’ **New** ’ **HTTP Header Auth**
2. **Name**: `Supabase Service Role`
3. **Header Name**: `apikey`
4. **Header Value**: `YOUR_SUPABASE_SERVICE_KEY`
5. Save

### 1.2 USAC API Key (HTTP Header Auth)

1. Go to **Credentials** ’ **New** ’ **HTTP Header Auth**
2. **Name**: `USAC API Key`
3. **Header Name**: `Authorization` (or as specified by USAC)
4. **Header Value**: `Bearer YOUR_USAC_API_KEY`
5. Save

### 1.3 Hunter.io API Key (HTTP Query Auth)

1. Go to **Credentials** ’ **New** ’ **HTTP Query Auth**
2. **Name**: `Hunter.io API Key`
3. **Parameter Name**: `api_key`
4. **Parameter Value**: `YOUR_HUNTER_IO_KEY`
5. Save

### 1.4 LinkedIn OAuth (OAuth2)

1. Go to **Credentials** ’ **New** ’ **OAuth2 API**
2. **Name**: `LinkedIn OAuth`
3. **Grant Type**: Authorization Code
4. **Authorization URL**: `https://www.linkedin.com/oauth/v2/authorization`
5. **Access Token URL**: `https://www.linkedin.com/oauth/v2/accessToken`
6. **Client ID**: `YOUR_LINKEDIN_CLIENT_ID`
7. **Client Secret**: `YOUR_LINKEDIN_CLIENT_SECRET`
8. **Scope**: `r_liteprofile r_emailaddress`
9. Save and connect

### 1.5 Anthropic API (for Claude Sonnet)

1. Go to **Credentials** ’ **New** ’ **Anthropic API**
2. **Name**: `Anthropic API Key`
3. **API Key**: `YOUR_ANTHROPIC_API_KEY`
4. Save

### 1.6 Microsoft Outlook OAuth

1. Go to **Credentials** ’ **New** ’ **Microsoft Outlook OAuth2 API**
2. **Name**: `Microsoft Outlook OAuth`
3. **Client ID**: `YOUR_MICROSOFT_CLIENT_ID`
4. **Client Secret**: `YOUR_MICROSOFT_CLIENT_SECRET`
5. **Tenant ID**: `YOUR_TENANT_ID`
6. Save and connect

---

## Step 2: Set Environment Variables in n8n

Set these environment variables in n8n (Settings ’ Environments):

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
USAC_API_URL=https://api.usac.gov/rhc
```

---

## Step 3: Import Workflows

### 3.1 Import Main Daily Workflow

1. In n8n, go to **Workflows** ’ **Import from File**
2. Select `01-main-daily-workflow.json`
3. Click **Import**
4. The workflow will appear with all nodes

### 3.2 Import Enrichment Sub-Workflow

1. **Workflows** ’ **Import from File**
2. Select `02-enrichment-sub-workflow.json`
3. Click **Import**

### 3.3 Import Rule Monitor Workflow

1. **Workflows** ’ **Import from File**
2. Select `03-rule-monitor-workflow.json`
3. Click **Import**

---

## Step 4: Configure Each Workflow

### Workflow 1: Main Daily Workflow

**Nodes to Review:**

1. **Fetch Form 465 Filings** (HTTP Request node)
   - Verify URL: `{{$env.USAC_API_URL}}/form465`
   - Select credential: `USAC API Key`
   - Adjust query parameters if USAC API differs

2. **Check Existing Hashes in Supabase** (HTTP Request node)
   - Select credential: `Supabase Service Role`

3. **Parse PDF Details** (Code node)
   -   **TODO**: Implement actual PDF parsing
   - Current version is a placeholder
   - Consider using `pdf-parse` npm package or external PDF API

4. **Query Historical USAC Data** (HTTP Request node)
   - Verify URL matches USAC API structure
   - Select credential: `USAC API Key`

5. **Insert into Supabase** (HTTP Request node)
   - Select credential: `Supabase Service Role`

**Test the Workflow:**
- Click **Execute Workflow** (top right)
- Check execution log for errors
- Verify data appears in Supabase `clinics_pending_review` table

---

### Workflow 2: Enrichment Sub-Workflow

**Nodes to Review:**

1. **Webhook Trigger**
   - Note the webhook URL (e.g., `https://hyamie.app.n8n.cloud/webhook/enrichment`)
   - Save this URL for dashboard configuration

2. **Fetch Clinic Details from Supabase**
   - Select credential: `Supabase Service Role`

3. **LinkedIn - Find Contact**
   - Select credential: `LinkedIn OAuth`
   -   Adjust API endpoint based on LinkedIn API access level

4. **Hunter.io - Find Email**
   - Select credential: `Hunter.io API Key`

5. **Claude Sonnet - Generate Email**
   - Select credential: `Anthropic API Key`
   - Review prompt template and adjust tone as needed

6. **Outlook - Create Draft**
   - Select credential: `Microsoft Outlook OAuth`

7. **Update Supabase - Mark as Processed**
   - Select credential: `Supabase Service Role`

**Test the Workflow:**
- Click **Execute Workflow** with test data
- Or use curl to test webhook:
  ```bash
  curl -X POST https://hyamie.app.n8n.cloud/webhook/enrichment \
    -H "Content-Type: application/json" \
    -d '{"clinic_ids": ["test-uuid"]}'
  ```

---

### Workflow 3: Rule Monitor Workflow

**Nodes to Review:**

1. **Schedule Trigger - Weekly Monday 9 AM**
   - Verify cron expression is correct
   - Adjust if you want different timing

2. **Scrape USAC News Page**
   - URL: `https://www.usac.org/rural-health-care/resources/news/`
   - Verify URL is still valid

3. **Parse Latest News** (Code node)
   -   **TODO**: Adjust regex patterns based on actual USAC HTML structure
   - Test by viewing page source and updating selectors

4. **Get Last Known Update from Supabase**
   - Select credential: `Supabase Service Role`

5. **Insert Alert into Supabase**
   - Select credential: `Supabase Service Role`

**Test the Workflow:**
- Click **Execute Workflow**
- Check `system_alerts` table in Supabase for new alert

---

## Step 5: Activate Workflows

**IMPORTANT**: Workflows must be activated to run on schedule or receive webhooks.

1. Open each workflow
2. Click **Active** toggle (top right) to **ON**
3. Verify status shows "Active"

**Active workflows:**
-  Main Daily Workflow (runs at 7 AM daily)
-  Enrichment Sub-Workflow (triggered by webhook)
-  Rule Monitor Workflow (runs Mondays at 9 AM)

---

## Step 6: Get Webhook URLs

### For Dashboard Integration

You need the enrichment webhook URL for the Next.js dashboard.

1. Open **Enrichment Sub-Workflow**
2. Click on **Webhook Trigger** node
3. Copy the **Production URL**
4. Save this in `../ENV_VARIABLES.md` under `N8N_ENRICHMENT_WEBHOOK_URL`

Example:
```env
N8N_ENRICHMENT_WEBHOOK_URL=https://hyamie.app.n8n.cloud/webhook/abc123-enrichment
```

---

## Step 7: Test End-to-End Flow

### Test 1: Manual Trigger Main Workflow

1. Open **Main Daily Workflow**
2. Click **Execute Workflow**
3. Watch execution progress (green = success, red = error)
4. Check Supabase for new rows in `clinics_pending_review`

### Test 2: Trigger Enrichment via Webhook

```bash
# Get a clinic ID from Supabase
# Then trigger enrichment:

curl -X POST https://hyamie.app.n8n.cloud/webhook/enrichment \
  -H "Content-Type: application/json" \
  -d '{"clinic_ids": ["YOUR_CLINIC_UUID"]}'
```

Expected result:
- Enrichment runs
- Email draft created in Outlook
- Clinic marked as processed in Supabase

### Test 3: Run Rule Monitor

1. Open **Rule Monitor Workflow**
2. Click **Execute Workflow**
3. Check `system_alerts` table for new alert (if USAC news changed)

---

## Common Issues & Troubleshooting

### Issue: "Invalid credentials"
- **Solution**: Re-check API keys in n8n credentials
- Verify keys haven't expired
- Check environment variables are set

### Issue: "Webhook not found"
- **Solution**: Make sure workflow is **activated**
- Webhooks only work when workflow is active

### Issue: PDF parsing fails
- **Solution**: The PDF parsing code is a placeholder
- Implement actual PDF extraction using:
  - `pdf-parse` npm package in Code node
  - External PDF API (e.g., Adobe PDF Services)
  - USAC may provide parsed data in API response

### Issue: "Rate limit exceeded"
- **Solution**:
  - Hunter.io free tier: 25 searches/month
  - Add rate limiting logic using n8n's `Wait` node
  - Upgrade API tiers as needed

### Issue: Email generation too generic
- **Solution**: Edit the Claude prompt in enrichment workflow
- Add more context fields
- Adjust temperature parameter (0.7 default)

### Issue: LinkedIn API access denied
- **Solution**: LinkedIn API has strict approval process
- Consider alternatives:
  - Phantombuster
  - Proxycurl
  - Manual LinkedIn search

---

## Monitoring & Logs

### View Execution History

1. Go to **Executions** (left sidebar)
2. See all workflow runs with status
3. Click any execution to see detailed logs

### Set Up Error Alerts

1. In workflow editor, click **Settings** (gear icon)
2. Go to **Error Workflow**
3. Create a simple workflow that sends you an email/Slack when errors occur

Example error notification workflow:
- Trigger: Error
- Action: Send email via SMTP or Slack message

---

## Performance Optimization

### Batching for Large Datasets

If you have many clinics to enrich:

1. Use n8n's `SplitInBatches` node
2. Process 10 clinics at a time
3. Add `Wait` node between batches (rate limiting)

Example:
```
Fetch Clinics ’ Split in Batches (10) ’ Enrichment Logic ’ Loop
```

### Caching Historical Data

To reduce API calls:

1. Store historical USAC data in Supabase
2. Update weekly instead of daily
3. Query Supabase instead of USAC API each time

---

## Next Steps

After n8n workflows are set up and tested:

1.  Workflows imported and activated
2.  All credentials configured
3.  Webhook URLs saved
4. ¡ **Next**: Phase 3 - Build Next.js Dashboard
5. See `../PROGRESS.md` for full checklist

---

## Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Community Forum](https://community.n8n.io/)
- [Supabase API Reference](https://supabase.com/docs/reference/javascript/introduction)
- [Claude API Documentation](https://docs.anthropic.com/)
